// Pure progression rules: rewards, streaks, stickers and purchases.
// The React provider in progress.tsx only stores and exposes this state.

import { awardAchievements, type Achievement } from './achievements';
import { BIOME_ANIMALS, type Animal, type BiomeId } from './animals';
import { addDays, getBiome, type Level } from './biomes';
import type { Rng } from './random';
import type { BoardSize, Difficulty } from './sudoku';

export interface ProgressState {
  coins: number;
  /** Best stars per level id (1-3). Missing = not cleared. */
  levelStars: Record<string, number>;
  /** Sticker ids: "biome:animalId". */
  stickers: string[];
  habitats: BiomeId[];
  decorations: string[];
  /** Achievement id -> date earned. */
  achievements: Record<string, string>;
  /** Rule ids whose explanation the player has already seen. */
  seenRules: string[];
  daily: { lastDate: string | null; streak: number; best: number };
  stats: {
    solved: number;
    perfect: number;
    hardNines: number;
    fastestFour: number | null;
    battles: number;
    runawaysCaught: number;
  };
}

export const INITIAL_PROGRESS: ProgressState = {
  coins: 0,
  levelStars: {},
  stickers: [],
  habitats: [],
  decorations: [],
  achievements: {},
  seenRules: [],
  daily: { lastDate: null, streak: 0, best: 0 },
  stats: { solved: 0, perfect: 0, hardNines: 0, fastestFour: null, battles: 0, runawaysCaught: 0 },
};

export type WinSource =
  | { mode: 'level'; level: Level }
  | { mode: 'daily'; date: string; biome: BiomeId; size: BoardSize; difficulty: Difficulty }
  | { mode: 'quick'; size: BoardSize; difficulty: Difficulty };

export interface WinStats {
  seconds: number;
  mistakes: number;
  hintsUsed: number;
  /** Runaway animals caught during the puzzle. */
  caught?: number;
}

export interface Reward {
  stars: number;
  /** Previous best for a level replay (0 if first clear). */
  previousStars: number;
  coins: number;
  sticker: { animal: Animal; biome: BiomeId } | null;
  achievements: Achievement[];
  streak: number | null;
}

export function starsFor({ mistakes, hintsUsed }: WinStats): number {
  if (mistakes === 0 && hintsUsed === 0) return 3;
  if (mistakes <= 2 && hintsUsed <= 1) return 2;
  return 1;
}

const QUICK_COINS: Record<BoardSize, number> = { 4: 3, 6: 5, 9: 10 };
const DAILY_COINS = 30;
const DAILY_STREAK_BONUS = 5; // per streak day, capped at 7 days
const DUPLICATE_STICKER_COINS = 20;
const RUNAWAY_COINS = 5; // per runaway caught
const BOSS_MULTIPLIER = 2; // first clear of a boss pays double

export const stickerId = (biome: BiomeId, animal: Animal) => `${biome}:${animal.id}`;

/** Current streak as shown to the player: broken if yesterday's daily was missed. */
export function liveStreak(s: ProgressState, today: string): number {
  const last = s.daily.lastDate;
  return last === today || last === addDays(today, -1) ? s.daily.streak : 0;
}

function drawSticker(s: ProgressState, biome: BiomeId, rng: Rng): Animal | null {
  const missing = BIOME_ANIMALS[biome].filter((a) => !s.stickers.includes(stickerId(biome, a)));
  return missing.length ? missing[Math.floor(rng() * missing.length)] : null;
}

export function applyWin(
  prev: ProgressState,
  source: WinSource,
  win: WinStats,
  today: string,
  rng: Rng = Math.random,
): { state: ProgressState; reward: Reward } {
  const stars = starsFor(win);
  const perfect = win.mistakes === 0 && win.hintsUsed === 0;
  let s: ProgressState = {
    ...prev,
    stats: {
      ...prev.stats,
      solved: prev.stats.solved + 1,
      perfect: prev.stats.perfect + (perfect ? 1 : 0),
      runawaysCaught: prev.stats.runawaysCaught + (win.caught ?? 0),
    },
  };
  const size = source.mode === 'level' ? source.level.size : source.size;
  const difficulty = source.mode === 'level' ? source.level.difficulty : source.difficulty;
  if (size === 9 && difficulty === 'hard') s.stats.hardNines += 1;
  if (size === 4) s.stats.fastestFour = Math.min(s.stats.fastestFour ?? Infinity, win.seconds);

  let coins = 0;
  let previousStars = 0;
  let sticker: Reward['sticker'] = null;
  let streak: number | null = null;
  const giveSticker = (biome: BiomeId) => {
    const animal = drawSticker(s, biome, rng);
    if (animal) {
      s = { ...s, stickers: [...s.stickers, stickerId(biome, animal)] };
      sticker = { animal, biome };
    } else {
      coins += DUPLICATE_STICKER_COINS; // album for this biome is full
    }
  };

  if (source.mode === 'level') {
    previousStars = prev.levelStars[source.level.id] ?? 0;
    if (!previousStars) {
      coins += (10 + 5 * stars) * (source.level.boss ? BOSS_MULTIPLIER : 1);
      giveSticker(source.level.biome);
    } else {
      // Replays pay a little, plus a bonus for improving the star rating.
      coins += 2 + 5 * Math.max(0, stars - previousStars);
    }
    s = { ...s, levelStars: { ...s.levelStars, [source.level.id]: Math.max(previousStars, stars) } };
  } else if (source.mode === 'daily') {
    if (prev.daily.lastDate !== source.date) {
      const continues = prev.daily.lastDate === addDays(source.date, -1);
      const nextStreak = continues ? prev.daily.streak + 1 : 1;
      s = { ...s, daily: { lastDate: source.date, streak: nextStreak, best: Math.max(prev.daily.best, nextStreak) } };
      streak = nextStreak;
      coins += DAILY_COINS + DAILY_STREAK_BONUS * Math.min(nextStreak, 7);
      giveSticker(source.biome);
    }
  } else {
    coins += QUICK_COINS[source.size];
  }

  coins += RUNAWAY_COINS * (win.caught ?? 0);
  s = { ...s, coins: s.coins + coins };
  const awarded = awardAchievements(s, today);
  return {
    state: awarded.state,
    reward: { stars, previousStars, coins, sticker, achievements: awarded.earned, streak },
  };
}

export function applySeenRules(prev: ProgressState, ids: string[]): ProgressState {
  const fresh = ids.filter((id) => !prev.seenRules.includes(id));
  return fresh.length ? { ...prev, seenRules: [...prev.seenRules, ...fresh] } : prev;
}

export function applyBattle(prev: ProgressState, today: string) {
  return awardAchievements({ ...prev, stats: { ...prev.stats, battles: prev.stats.battles + 1 } }, today);
}

export function applyBuyHabitat(prev: ProgressState, biome: BiomeId, today: string) {
  const cost = getBiome(biome).habitatCost;
  if (prev.habitats.includes(biome) || prev.coins < cost) return null;
  return awardAchievements({ ...prev, coins: prev.coins - cost, habitats: [...prev.habitats, biome] }, today);
}

export function applyBuyDecoration(prev: ProgressState, id: string, cost: number, today: string) {
  if (prev.decorations.includes(id) || prev.coins < cost) return null;
  return awardAchievements({ ...prev, coins: prev.coins - cost, decorations: [...prev.decorations, id] }, today);
}

/** Merge stored data over defaults so new fields added in updates get sane values. */
export function hydrate(raw: unknown): ProgressState {
  if (!raw || typeof raw !== 'object') return INITIAL_PROGRESS;
  const r = raw as Partial<ProgressState>;
  return {
    ...INITIAL_PROGRESS,
    ...r,
    daily: { ...INITIAL_PROGRESS.daily, ...r.daily },
    stats: { ...INITIAL_PROGRESS.stats, ...r.stats },
  };
}
