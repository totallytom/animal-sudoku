import type { WinSource } from './progressState';
import type { Puzzle } from './sudoku';

/** Everything needed to start (or resume) a solo game. Plain data, so it can be saved. */
export interface GameSetupData {
  puzzle: Puzzle;
  source: WinSource;
  /** Shown above the board, e.g. "Savanna · Level 3 · Easy". */
  label: string;
}
