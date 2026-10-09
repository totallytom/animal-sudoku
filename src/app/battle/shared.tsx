import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimalPicker } from '../../components/AnimalPicker';
import { BattleResults, rankPlayers, type Standing } from '../../components/BattleResults';
import { Board } from '../../components/Board';
import { DialogButton } from '../../components/Dialog';
import { PlayerChip, PlayerSymbol } from '../../components/PlayerChip';
import { QuitGuard } from '../../components/QuitGuard';
import { useAnimals } from '../../lib/animals';
import { useFeedback } from '../../lib/haptics';
import type { Achievement } from '../../lib/achievements';
import { PLAYER_STYLES, parsePlayers } from '../../lib/players';
import { useProgress } from '../../lib/progress';
import { useSettings } from '../../lib/settings';
import { completedUnits, generatePuzzle, parseDifficulty, parseSize, type Puzzle } from '../../lib/sudoku';
import { boardPalette, colors } from '../../lib/theme';

const FLASH_MS = 900;

export default function SharedBoardScreen() {
  const params = useLocalSearchParams<{ size: string; difficulty: string; players: string }>();
  const size = parseSize(params.size);
  const difficulty = parseDifficulty(params.difficulty);
  const [players] = useState(() => parsePlayers(params.players));
  const { settings } = useSettings();
  const feedback = useFeedback();
  const animals = useAnimals();
  const palette = boardPalette(settings.colorblindMode);
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const boardWidth = Math.min(screenWidth - 24, 460);

  const [puzzle, setPuzzle] = useState<Puzzle>(() => generatePuzzle(size, difficulty));
  const [grid, setGrid] = useState<number[]>(() => [...puzzle.puzzle]);
  const [owners, setOwners] = useState<number[]>(() => new Array(puzzle.puzzle.length).fill(-1));
  const [scores, setScores] = useState<number[]>(() => players.map(() => 0));
  const [starter, setStarter] = useState(0);
  const [turn, setTurn] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  // A wrong guess is shown briefly with a ✕, then removed.
  const [flash, setFlash] = useState<{ cell: number; value: number } | null>(null);
  const [celebration, setCelebration] = useState<{ cells: number[]; id: number } | null>(null);
  const [message, setMessage] = useState(`${players[0]} goes first. Tap an empty square, then pick an animal.`);
  const [badges, setBadges] = useState<Achievement[]>([]);
  const { recordBattle } = useProgress();
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
  }, []);

  const given = useMemo(() => puzzle.puzzle.map((v) => v !== 0), [puzzle]);
  const emptyNotes = useMemo(() => new Array(puzzle.puzzle.length).fill(0), [puzzle]);
  const done = grid.every((v) => v !== 0);

  const displayGrid = flash ? grid.map((v, i) => (i === flash.cell ? flash.value : v)) : grid;
  const wrong = useMemo(() => new Set(flash ? [flash.cell] : []), [flash]);
  const markers = useMemo(() => owners.map((o) => (o >= 0 ? PLAYER_STYLES[o] : null)), [owners]);
  const counts = useMemo(() => {
    const c = new Array(size + 1).fill(0);
    grid.forEach((v) => c[v]++);
    return c;
  }, [grid, size]);

  const showFlash = (cell: number, value: number) => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlash({ cell, value });
    flashTimer.current = setTimeout(() => setFlash(null), FLASH_MS);
  };

  const select = (cell: number) => {
    if (grid[cell] || done) return; // only empty cells are playable
    setSelected(cell);
  };

  const place = (value: number) => {
    if (selected === null || grid[selected] || done) return;
    const name = players[turn];
    const animal = animals[value - 1].name;
    const nextTurn = (turn + 1) % players.length;

    if (value === puzzle.solution[selected]) {
      const nextGrid = grid.map((v, i) => (i === selected ? value : v));
      setGrid(nextGrid);
      setOwners((o) => o.map((p, i) => (i === selected ? turn : p)));
      setScores((s) => s.map((p, i) => (i === turn ? p + 1 : p)));
      const units = completedUnits(puzzle, nextGrid, selected);
      if (units.length) setCelebration((c) => ({ cells: units, id: (c?.id ?? 0) + 1 }));
      if (nextGrid.every((v) => v !== 0)) {
        setMessage('Board complete!');
        feedback.win();
        setBadges(recordBattle());
      } else {
        setMessage(`${name} placed a ${animal}: +1. ${players[nextTurn]}'s turn.`);
        feedback.place(value);
        if (units.length) setTimeout(feedback.unit, 180);
      }
    } else {
      setScores((s) => s.map((p, i) => (i === turn ? p - 1 : p)));
      showFlash(selected, value);
      setMessage(`${animal} doesn't go there: ${name} −1. ${players[nextTurn]}'s turn.`);
      feedback.error();
    }
    setTurn(nextTurn);
    setSelected(null);
  };

  const rematch = () => {
    const next = generatePuzzle(size, difficulty);
    // Rotate who goes first so it stays fair over several rounds.
    const nextStarter = (starter + 1) % players.length;
    setPuzzle(next);
    setGrid([...next.puzzle]);
    setOwners(new Array(next.puzzle.length).fill(-1));
    setScores(players.map(() => 0));
    setStarter(nextStarter);
    setTurn(nextStarter);
    setSelected(null);
    setFlash(null);
    setCelebration(null);
    setBadges([]);
    setMessage(`${players[nextStarter]} goes first`);
  };

  const ranks = rankPlayers(scores, false);
  const standings: Standing[] = players
    .map((name, i) => ({
      player: i,
      name,
      rank: ranks[i],
      detail: `${scores[i]} point${Math.abs(scores[i]) === 1 ? '' : 's'} · ${owners.filter((o) => o === i).length} animals placed`,
    }))
    .sort((a, b) => a.rank - b.rank);

  return (
    <>
      <QuitGuard active={!done} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
        <View style={[styles.turnBanner, { width: boardWidth, borderColor: PLAYER_STYLES[turn].color }]}>
          <PlayerSymbol index={turn} size={36} />
          <View style={styles.turnText}>
            <Text style={styles.turnLabel}>{done ? 'Game over' : 'Your turn'}</Text>
            <Text style={styles.turnName} numberOfLines={1}>
              {done ? 'Board complete' : players[turn]}
            </Text>
          </View>
        </View>

        <View style={[styles.scores, { width: boardWidth }]}>
          {players.map((name, i) => (
            <PlayerChip key={i} index={i} name={name} detail={`${scores[i]} pts`} active={!done && i === turn} />
          ))}
        </View>

        <Board
          puzzle={puzzle}
          grid={displayGrid}
          given={given}
          notes={emptyNotes}
          selected={selected}
          wrong={wrong}
          highlightMatching={settings.highlightMatching}
          showBadges={settings.showNumberBadges}
          palette={palette}
          markers={markers}
          celebration={celebration}
          width={boardWidth}
          onSelect={select}
        />

        <Text style={[styles.message, { width: boardWidth }]} accessibilityLiveRegion="polite">
          {message}
        </Text>

        <AnimalPicker
          size={size}
          counts={counts}
          width={boardWidth}
          tinted={palette.animalTints}
          showBadges={settings.showNumberBadges}
          onPick={place}
        />
      </ScrollView>

      <BattleResults visible={done} standings={standings} badges={badges}>
        <DialogButton label="Rematch (new puzzle)" primary onPress={rematch} />
        <DialogButton label="Change setup" onPress={() => router.back()} />
        <DialogButton label="Home" onPress={() => router.dismissAll()} />
      </BattleResults>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingTop: 8,
    gap: 12,
  },
  turnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 3,
    backgroundColor: colors.surface,
  },
  turnText: {
    flex: 1,
  },
  turnLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  turnName: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
  },
  scores: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  message: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    minHeight: 20,
  },
});
