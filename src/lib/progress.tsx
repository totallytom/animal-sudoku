import Storage from 'expo-sqlite/kv-store';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

import { totalStars, type Achievement } from './achievements';
import type { BiomeId } from './animals';
import { dateKey, getBiome, type Level } from './biomes';
import {
  applyBattle,
  applyBuyDecoration,
  applyBuyHabitat,
  applySeenRules,
  applyWin,
  hydrate,
  liveStreak,
  type ProgressState,
  type Reward,
  type WinSource,
  type WinStats,
} from './progressState';

const STORAGE_KEY = 'progress';

function load(): ProgressState {
  try {
    const raw = Storage.getItemSync(STORAGE_KEY);
    return hydrate(raw ? JSON.parse(raw) : null);
  } catch {
    return hydrate(null);
  }
}

interface ProgressContextValue {
  progress: ProgressState;
  stars: number;
  streak: number;
  dailyDoneToday: boolean;
  isBiomeUnlocked: (biome: BiomeId) => boolean;
  isLevelUnlocked: (level: Level) => boolean;
  recordWin: (source: WinSource, stats: WinStats) => Reward;
  recordBattle: () => Achievement[];
  buyHabitat: (biome: BiomeId) => Achievement[] | null;
  buyDecoration: (id: string, cost: number) => Achievement[] | null;
  markRulesSeen: (ids: string[]) => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressState>(load);
  // Actions read the latest state from here so back-to-back calls don't use stale data.
  const latest = useRef(progress);

  const commit = useCallback((next: ProgressState) => {
    latest.current = next;
    setProgress(next);
    try {
      Storage.setItemSync(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Non-fatal: progress still applies for this session.
    }
  }, []);

  const value = useMemo<ProgressContextValue>(() => {
    const today = dateKey();
    const stars = totalStars(progress);
    return {
      progress,
      stars,
      streak: liveStreak(progress, today),
      dailyDoneToday: progress.daily.lastDate === today,
      isBiomeUnlocked: (biome) => stars >= getBiome(biome).starsToUnlock,
      isLevelUnlocked: (level) => {
        if (stars < getBiome(level.biome).starsToUnlock) return false;
        return level.number === 1 || (progress.levelStars[`${level.biome}-${level.number - 1}`] ?? 0) > 0;
      },
      recordWin: (source, stats) => {
        const { state, reward } = applyWin(latest.current, source, stats, dateKey());
        commit(state);
        return reward;
      },
      recordBattle: () => {
        const { state, earned } = applyBattle(latest.current, dateKey());
        commit(state);
        return earned;
      },
      buyHabitat: (biome) => {
        const result = applyBuyHabitat(latest.current, biome, dateKey());
        if (!result) return null;
        commit(result.state);
        return result.earned;
      },
      markRulesSeen: (ids) => {
        const next = applySeenRules(latest.current, ids);
        if (next !== latest.current) commit(next);
      },
      buyDecoration: (id, cost) => {
        const result = applyBuyDecoration(latest.current, id, cost, dateKey());
        if (!result) return null;
        commit(result.state);
        return result.earned;
      },
    };
  }, [progress, commit]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider');
  return ctx;
}
