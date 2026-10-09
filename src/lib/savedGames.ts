import Storage from 'expo-sqlite/kv-store';

import { dateKey } from './biomes';
import type { GameSetupData } from './gameSetup';
import type { SavedGameState } from './useSudokuGame';

// Bump when the saved shape changes incompatibly; older saves are then ignored.
const SAVE_VERSION = 1;
const PREFIX = 'save:';
const LAST_KEY = 'save:last';

/** Where a save belongs, so Home can offer "Continue" and route back to it. */
export type SaveSlot =
  | { kind: 'quick'; size: number }
  | { kind: 'level'; levelId: string }
  | { kind: 'daily'; date: string };

export interface SavedGame {
  version: number;
  slot: SaveSlot;
  /** Shown on the Home "Continue" card, e.g. "Savanna · Level 3". */
  title: string;
  savedAt: number;
  setup: GameSetupData;
  state: SavedGameState;
}

export function slotId(slot: SaveSlot): string {
  switch (slot.kind) {
    case 'quick':
      return `quick-${slot.size}`;
    case 'level':
      return `level-${slot.levelId}`;
    case 'daily':
      return `daily-${slot.date}`;
  }
}

function read(key: string): SavedGame | null {
  try {
    const raw = Storage.getItemSync(key);
    if (!raw) return null;
    const data = JSON.parse(raw) as SavedGame;
    if (data?.version !== SAVE_VERSION || !data.setup?.puzzle || !data.state?.grid) return null;
    // Yesterday's daily can't be finished for credit any more.
    if (data.slot.kind === 'daily' && data.slot.date !== dateKey()) return null;
    return data;
  } catch {
    return null;
  }
}

export function loadGame(slot: SaveSlot): SavedGame | null {
  return read(PREFIX + slotId(slot));
}

export function saveGame(slot: SaveSlot, title: string, setup: GameSetupData, state: SavedGameState) {
  const data: SavedGame = { version: SAVE_VERSION, slot, title, savedAt: Date.now(), setup, state };
  try {
    Storage.setItemSync(PREFIX + slotId(slot), JSON.stringify(data));
    Storage.setItemSync(LAST_KEY, slotId(slot));
  } catch {
    // Saving is best-effort; the game keeps working without it.
  }
}

export function clearGame(slot: SaveSlot) {
  try {
    Storage.removeItemSync(PREFIX + slotId(slot));
    if (Storage.getItemSync(LAST_KEY) === slotId(slot)) Storage.removeItemSync(LAST_KEY);
  } catch {
    // Ignore: a stale save is harmless and gets overwritten later.
  }
}

/** The most recently played unfinished game, for the Home "Continue" card. */
export function lastSavedGame(): SavedGame | null {
  try {
    const id = Storage.getItemSync(LAST_KEY);
    return id ? read(PREFIX + id) : null;
  } catch {
    return null;
  }
}
