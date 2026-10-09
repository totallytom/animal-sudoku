import { useEffect, useMemo, useState } from 'react';

import { useFeedback } from './haptics';
import { completedUnits, computeCandidates, isPeer, type Puzzle } from './sudoku';

export type GameStatus = 'playing' | 'won' | 'lost';
export type LostReason = 'mistakes' | 'time';

export interface GameStats {
  seconds: number;
  mistakes: number;
  hintsUsed: number;
  /** Runaway animals caught. */
  caught: number;
}

interface Options {
  /** 0 means no limit. */
  mistakeLimit: number;
  showMistakes: boolean;
  /** Stops the timer, e.g. while the phone is being passed. */
  paused?: boolean;
  /** Boss levels: seconds until the game is lost. */
  timeLimit?: number;
  /** A runaway animal sits in an empty square where it belongs and hops every 30s until caught. */
  runaway?: boolean;
  onWin?: (stats: GameStats) => void;
  /** Pick up a saved game instead of starting fresh. Must match the puzzle from `createInitial`. */
  resume?: SavedGameState | null;
}

interface Snapshot {
  grid: number[];
  notes: number[];
}

/** Everything about a game in progress that's worth saving. */
export interface SavedGameState {
  grid: number[];
  notes: number[];
  history: Snapshot[];
  mistakes: number;
  hintsUsed: number;
  caught: number;
  runawaySince: number;
  seconds: number;
}

// Undo steps kept in a save (the live game keeps up to 100).
const SAVED_HISTORY = 30;

export const RUNAWAY_HOP_SECONDS = 30;
const RUNAWAY_FIRST_AT = 5;
const RUNAWAY_COOLDOWN = 15;

// Stable pseudo-random pick, so the runaway stays put until its hop timer runs out.
function hash(a: number, b: number, c: number): number {
  let h = Math.imul(a + 1, 2654435761) ^ Math.imul(b + 7, 40503) ^ Math.imul(c + 13, 2246822519);
  h = Math.imul(h ^ (h >>> 15), 2246822507);
  return (h ^ (h >>> 13)) >>> 0;
}

/** Single-player sudoku state and actions. Used by solo play and Race battles. */
export function useSudokuGame(
  createInitial: () => Puzzle,
  { mistakeLimit, showMistakes, paused, timeLimit = 0, runaway: runawayEnabled = false, onWin, resume }: Options,
) {
  const feedback = useFeedback();

  const [game, setGame] = useState<Puzzle>(createInitial);
  const [grid, setGrid] = useState<number[]>(() => resume?.grid ?? [...game.puzzle]);
  const [notes, setNotes] = useState<number[]>(() => resume?.notes ?? new Array(game.puzzle.length).fill(0));
  const [history, setHistory] = useState<Snapshot[]>(() => resume?.history ?? []);
  const [selected, setSelected] = useState<number | null>(null);
  const [notesMode, setNotesMode] = useState(false);
  const [mistakes, setMistakes] = useState(resume?.mistakes ?? 0);
  const [hintsUsed, setHintsUsed] = useState(resume?.hintsUsed ?? 0);
  const [caught, setCaught] = useState(resume?.caught ?? 0);
  const [runawaySince, setRunawaySince] = useState(resume?.runawaySince ?? RUNAWAY_FIRST_AT);
  const [seconds, setSeconds] = useState(resume?.seconds ?? 0);
  const [baseStatus, setBaseStatus] = useState<GameStatus>('playing');
  const [lostByMistakes, setLostByMistakes] = useState(false);
  const [celebration, setCelebration] = useState<{ cells: number[]; id: number } | null>(null);

  // Running out of time is derived from the clock rather than stored.
  const timedOut = timeLimit > 0 && seconds >= timeLimit && baseStatus === 'playing';
  const status: GameStatus = timedOut ? 'lost' : baseStatus;
  const lostReason: LostReason | null = status !== 'lost' ? null : lostByMistakes ? 'mistakes' : 'time';
  const playing = status === 'playing';

  const given = useMemo(() => game.puzzle.map((v) => v !== 0), [game]);

  useEffect(() => {
    if (!playing || paused) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [playing, paused]);

  const wrong = useMemo(() => {
    const set = new Set<number>();
    if (!showMistakes) return set;
    grid.forEach((v, i) => {
      if (v && !given[i] && v !== game.solution[i]) set.add(i);
    });
    return set;
  }, [grid, given, game, showMistakes]);

  const counts = useMemo(() => {
    const c = new Array(game.layout.size + 1).fill(0);
    grid.forEach((v) => c[v]++);
    return c;
  }, [grid, game]);

  const runaway = useMemo(() => {
    if (!runawayEnabled || !playing || seconds < runawaySince) return null;
    const elapsed = seconds - runawaySince;
    const hop = Math.floor(elapsed / RUNAWAY_HOP_SECONDS);
    let cell = -1;
    let best = Infinity;
    grid.forEach((v, i) => {
      if (v) return;
      const h = hash(i, runawaySince, hop);
      if (h < best) {
        best = h;
        cell = i;
      }
    });
    if (cell < 0) return null;
    return { cell, value: game.solution[cell], secondsLeft: RUNAWAY_HOP_SECONDS - (elapsed % RUNAWAY_HOP_SECONDS) };
  }, [runawayEnabled, playing, seconds, runawaySince, grid, game]);

  /** Start fresh on a puzzle (a new one, or the same one to retry). */
  const load = (puzzle: Puzzle) => {
    setGame(puzzle);
    setGrid([...puzzle.puzzle]);
    setNotes(new Array(puzzle.puzzle.length).fill(0));
    setHistory([]);
    setSelected(null);
    setNotesMode(false);
    setMistakes(0);
    setHintsUsed(0);
    setCaught(0);
    setRunawaySince(RUNAWAY_FIRST_AT);
    setSeconds(0);
    setBaseStatus('playing');
    setLostByMistakes(false);
    setCelebration(null);
  };

  const pushHistory = () => setHistory((h) => [...h.slice(-99), { grid, notes }]);

  const celebrate = (cells: number[]) => setCelebration((c) => ({ cells, id: (c?.id ?? 0) + 1 }));

  // Writes a value, clears that animal from peer notes, plays feedback,
  // celebrates completed rows/columns/regions, and checks for a win.
  const commit = (cell: number, value: number, stats: Omit<GameStats, 'seconds'> = { mistakes, hintsUsed, caught }) => {
    const nextGrid = grid.map((v, i) => (i === cell ? value : v));
    setGrid(nextGrid);
    const bit = 1 << value;
    setNotes((prev) => prev.map((m, i) => (i === cell ? 0 : isPeer(game, cell, i) ? m & ~bit : m)));

    if (nextGrid.every((v, i) => v === game.solution[i])) {
      setBaseStatus('won');
      setSelected(null);
      // Whole-board wave, rippling out from the last animal placed.
      const n = game.layout.size;
      const dist = (i: number) => Math.abs(Math.floor(i / n) - Math.floor(cell / n)) + Math.abs((i % n) - (cell % n));
      celebrate([...nextGrid.keys()].sort((a, b) => dist(a) - dist(b)));
      feedback.win();
      onWin?.({ seconds, ...stats });
      return true;
    }

    if (value !== game.solution[cell]) {
      // With mistakes hidden, a wrong animal sounds like any other placement.
      if (showMistakes) feedback.error();
      else feedback.place(value);
      return false;
    }
    feedback.place(value);
    const done = completedUnits(game, nextGrid, cell);
    if (done.length) {
      celebrate(done);
      setTimeout(feedback.unit, 180); // let the animal's sound start first
    }
    return false;
  };

  const place = (value: number) => {
    if (selected === null || given[selected] || !playing) return;

    if (notesMode) {
      if (grid[selected]) return;
      pushHistory();
      setNotes((prev) => prev.map((m, i) => (i === selected ? m ^ (1 << value) : m)));
      feedback.tap();
      return;
    }

    pushHistory();
    if (grid[selected] === value) {
      // Tapping the same animal again clears the cell.
      setGrid((g) => g.map((v, i) => (i === selected ? 0 : v)));
      return;
    }

    const catches = runaway && runaway.cell === selected && runaway.value === value;
    const nextCaught = caught + (catches ? 1 : 0);
    if (catches) {
      setCaught(nextCaught);
      setRunawaySince(seconds + RUNAWAY_COOLDOWN);
      setTimeout(feedback.coin, 250);
    }
    if (commit(selected, value, { mistakes, hintsUsed, caught: nextCaught })) return;

    if (value !== game.solution[selected]) {
      const total = mistakes + 1;
      setMistakes(total);
      if (mistakeLimit && total >= mistakeLimit) {
        setBaseStatus('lost');
        setLostByMistakes(true);
        setSelected(null);
      }
    }
  };

  const erase = () => {
    if (selected === null || given[selected] || !playing) return;
    if (!grid[selected] && !notes[selected]) return;
    pushHistory();
    setGrid((g) => g.map((v, i) => (i === selected ? 0 : v)));
    setNotes((n) => n.map((m, i) => (i === selected ? 0 : m)));
  };

  const undo = () => {
    const last = history[history.length - 1];
    if (!last || !playing) return;
    setGrid(last.grid);
    setNotes(last.notes);
    setHistory((h) => h.slice(0, -1));
  };

  const autoNotes = () => {
    if (!playing) return;
    pushHistory();
    setNotes(computeCandidates(game, grid));
    feedback.tap();
  };

  const hint = () => {
    if (!playing) return;
    // Use the selected cell if it's empty or wrong; otherwise pick a random unsolved cell.
    let target = selected;
    if (target === null || given[target] || grid[target] === game.solution[target]) {
      const open = grid.map((v, i) => (v === game.solution[i] ? -1 : i)).filter((i) => i >= 0);
      if (!open.length) return;
      target = open[Math.floor(Math.random() * open.length)];
    }
    pushHistory();
    setSelected(target);
    setHintsUsed(hintsUsed + 1);
    commit(target, game.solution[target], { mistakes, hintsUsed: hintsUsed + 1, caught });
  };

  // Rebuilt only when something worth saving changes. The clock is rounded to
  // 10-second steps here so saving doesn't happen every second; the screen saves
  // the exact time when the app goes to the background.
  const savedClock = Math.floor(seconds / 10) * 10;
  const snapshot = useMemo<SavedGameState>(
    () => ({ grid, notes, history: history.slice(-SAVED_HISTORY), mistakes, hintsUsed, caught, runawaySince, seconds: savedClock }),
    [grid, notes, history, mistakes, hintsUsed, caught, runawaySince, savedClock],
  );

  return {
    game,
    snapshot,
    grid,
    notes,
    given,
    wrong,
    counts,
    selected,
    setSelected,
    notesMode,
    toggleNotesMode: () => setNotesMode((v) => !v),
    mistakes,
    hintsUsed,
    caught,
    runaway,
    seconds,
    status,
    lostReason,
    celebration,
    canUndo: history.length > 0,
    load,
    place,
    erase,
    undo,
    autoNotes,
    hint,
  };
}

export function formatTime(seconds: number): string {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.max(0, seconds) % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
