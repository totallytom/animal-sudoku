import type { BiomeId } from './animals';
import { BIOMES, LEVELS, levelsInBiome } from './biomes';
import type { ProgressState } from './progressState';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  badge: string;
  coins: number;
  progress: (s: ProgressState) => { current: number; target: number };
}

const count = (current: number, target: number) => ({ current: Math.min(current, target), target });
const flag = (done: boolean) => ({ current: done ? 1 : 0, target: 1 });

export function totalStars(s: ProgressState): number {
  return Object.values(s.levelStars).reduce((a, b) => a + b, 0);
}

function biomeCleared(s: ProgressState, biome: BiomeId): number {
  return levelsInBiome(biome).filter((l) => (s.levelStars[l.id] ?? 0) > 0).length;
}

const STICKER_TOTAL = BIOMES.length * 9;

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-steps', name: 'First Steps', description: 'Solve your first puzzle', badge: '🐾', coins: 10, progress: (s) => count(s.stats.solved, 1) },
  { id: 'puzzle-pal', name: 'Puzzle Pal', description: 'Solve 10 puzzles', badge: '🧩', coins: 25, progress: (s) => count(s.stats.solved, 10) },
  { id: 'ranger', name: 'Sudoku Ranger', description: 'Solve 50 puzzles', badge: '🎖️', coins: 75, progress: (s) => count(s.stats.solved, 50) },
  { id: 'clean-paws', name: 'Clean Paws', description: 'Solve a puzzle with no mistakes and no hints', badge: '✨', coins: 15, progress: (s) => count(s.stats.perfect, 1) },
  { id: 'flawless', name: 'Flawless Ten', description: 'Get 10 perfect solves', badge: '💎', coins: 60, progress: (s) => count(s.stats.perfect, 10) },
  { id: 'quick-paws', name: 'Quick Paws', description: 'Solve a 4×4 in under 30 seconds', badge: '⚡', coins: 20, progress: (s) => flag(s.stats.fastestFour !== null && s.stats.fastestFour < 30) },
  { id: 'big-game', name: 'Big Game', description: 'Solve a hard 9×9', badge: '🦣', coins: 40, progress: (s) => count(s.stats.hardNines, 1) },
  { id: 'streak-3', name: 'Warming Up', description: 'Reach a 3-day daily streak', badge: '🔥', coins: 20, progress: (s) => count(s.daily.best, 3) },
  { id: 'streak-7', name: 'Week of Wild', description: 'Reach a 7-day daily streak', badge: '📅', coins: 50, progress: (s) => count(s.daily.best, 7) },
  { id: 'streak-30', name: 'Creature of Habit', description: 'Reach a 30-day daily streak', badge: '🏆', coins: 200, progress: (s) => count(s.daily.best, 30) },
  ...BIOMES.map<Achievement>((b) => ({
    id: `explorer-${b.id}`,
    name: `${b.name} Explorer`,
    description: `Clear every ${b.name} level`,
    badge: b.emoji,
    coins: 50,
    progress: (s) => count(biomeCleared(s, b.id), levelsInBiome(b.id).length),
  })),
  ...BIOMES.map<Achievement>((b) => ({
    id: `boss-${b.id}`,
    name: `${b.name} Champion`,
    description: `Beat the ${b.name} boss puzzle`,
    badge: '👑',
    coins: 75,
    progress: (s) => flag((s.levelStars[`${b.id}-12`] ?? 0) > 0),
  })),
  { id: 'wrangler', name: 'Wrangler', description: 'Catch 10 runaway animals', badge: '🪢', coins: 40, progress: (s) => count(s.stats.runawaysCaught, 10) },
  { id: 'star-gazer', name: 'Star Gazer', description: 'Earn 100 stars', badge: '⭐', coins: 100, progress: (s) => count(totalStars(s), 100) },
  { id: 'all-stars', name: 'All the Stars', description: `Earn all ${LEVELS.length * 3} stars`, badge: '🌟', coins: 300, progress: (s) => count(totalStars(s), LEVELS.length * 3) },
  { id: 'sticker-half', name: 'Sticker Fan', description: `Collect ${STICKER_TOTAL / 2} stickers`, badge: '📒', coins: 50, progress: (s) => count(s.stickers.length, STICKER_TOTAL / 2) },
  { id: 'sticker-all', name: 'Complete Album', description: `Collect all ${STICKER_TOTAL} stickers`, badge: '📚', coins: 200, progress: (s) => count(s.stickers.length, STICKER_TOTAL) },
  { id: 'first-habitat', name: 'Groundbreaker', description: 'Build your first sanctuary habitat', badge: '🏗️', coins: 20, progress: (s) => count(s.habitats.length, 1) },
  { id: 'sanctuary', name: 'Head Keeper', description: 'Build every habitat', badge: '🏡', coins: 100, progress: (s) => count(s.habitats.length, BIOMES.length) },
  { id: 'battle-buddies', name: 'Battle Buddies', description: 'Finish a pass-the-phone battle', badge: '⚔️', coins: 20, progress: (s) => count(s.stats.battles, 1) },
];

export function isEarned(a: Achievement, s: ProgressState): boolean {
  const { current, target } = a.progress(s);
  return current >= target;
}

/** Marks newly met achievements as earned and pays out their coins. */
export function awardAchievements(s: ProgressState, today: string): { state: ProgressState; earned: Achievement[] } {
  const earned = ACHIEVEMENTS.filter((a) => !s.achievements[a.id] && isEarned(a, s));
  if (!earned.length) return { state: s, earned };
  const achievements = { ...s.achievements };
  earned.forEach((a) => (achievements[a.id] = today));
  return {
    state: { ...s, achievements, coins: s.coins + earned.reduce((sum, a) => sum + a.coins, 0) },
    earned,
  };
}
