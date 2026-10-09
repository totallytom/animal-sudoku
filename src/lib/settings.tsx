import Storage from 'expo-sqlite/kv-store';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { Difficulty } from './sudoku';

/** 0 means no limit. */
export type MistakeLimit = 0 | 3 | 5;

export interface Settings {
  difficulty: Difficulty;
  showMistakes: boolean;
  mistakeLimit: MistakeLimit;
  highlightMatching: boolean;
  showTimer: boolean;
  haptics: boolean;
  sound: boolean;
  colorblindMode: boolean;
  showNumberBadges: boolean;
  /** Draw a round token frame behind every animal. */
  animalFrames: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  difficulty: 'easy',
  showMistakes: true,
  mistakeLimit: 0,
  highlightMatching: true,
  showTimer: true,
  haptics: true,
  sound: true,
  colorblindMode: false,
  showNumberBadges: false,
  animalFrames: false,
};

const STORAGE_KEY = 'settings';

function loadSettings(): Settings {
  try {
    const raw = Storage.getItemSync(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // Fall back to defaults if storage is unavailable or corrupt.
  }
  return DEFAULT_SETTINGS;
}

interface SettingsContextValue {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  const persist = useCallback((next: Settings) => {
    setSettings(next);
    try {
      Storage.setItemSync(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Non-fatal: settings still apply for this session.
    }
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      update: (patch) => persist({ ...settings, ...patch }),
      reset: () => persist(DEFAULT_SETTINGS),
    }),
    [settings, persist],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
