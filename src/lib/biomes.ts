import { BIOME_ANIMALS, type Animal, type BiomeId } from './animals';
import { seededRng } from './random';
import type { RuleId } from './rules';
import { generatePuzzle, type BoardSize, type Difficulty, type Puzzle, type VariantSpec } from './sudoku';

export type Twist = 'predator' | 'herds' | 'jigsaw' | 'habitat';

export interface TerrainKind {
  kind: string;
  name: string;
  emoji: string;
  /** Animal ids allowed on this terrain. */
  animals: string[];
}

export interface Biome {
  id: BiomeId;
  name: string;
  emoji: string;
  tagline: string;
  /** Total stars needed to open this biome. */
  starsToUnlock: number;
  /** Coins to build this biome's habitat in the sanctuary. */
  habitatCost: number;
  color: string;
  ground: string;
  /** Scenery dotted around the sanctuary habitat. */
  scenery: string[];
  /** The rule twist this world is built around. */
  twist: Twist;
  /** Predator & prey pairs (animal ids) used by 'predator' levels. */
  predators: [string, string][];
  /** Terrain used by 'habitat' levels. */
  terrain: TerrainKind[];
}

export const BIOMES: Biome[] = [
  {
    id: 'savanna',
    name: 'Savanna',
    emoji: '🌾',
    tagline: 'Lions, giraffes and elephants under the big sky.',
    starsToUnlock: 0,
    habitatCost: 100,
    color: '#F4C77B',
    ground: '#F8E3B5',
    scenery: ['🌳', '🌾', '⛰️', '🌾'],
    twist: 'predator',
    predators: [
      ['lion', 'zebra'],
      ['lion', 'giraffe'],
      ['crocodile', 'flamingo'],
    ],
    terrain: [],
  },
  {
    id: 'ocean',
    name: 'Ocean',
    emoji: '🌊',
    tagline: 'Dive in with whales, octopuses and sharks.',
    starsToUnlock: 18,
    habitatCost: 150,
    color: '#6FB2E8',
    ground: '#CFE7F8',
    scenery: ['🌊', '🐚', '💧', '🌊'],
    twist: 'herds',
    predators: [],
    terrain: [],
  },
  {
    id: 'arctic',
    name: 'Arctic',
    emoji: '❄️',
    tagline: 'Penguins, polar bears and snowy owls on the ice.',
    starsToUnlock: 40,
    habitatCost: 200,
    color: '#9CC9E0',
    ground: '#EEF6FB',
    scenery: ['🧊', '❄️', '🏔️', '🧊'],
    twist: 'jigsaw',
    predators: [],
    terrain: [],
  },
  {
    id: 'jungle',
    name: 'Jungle',
    emoji: '🌴',
    tagline: 'Tigers, parrots and sloths deep in the rainforest.',
    starsToUnlock: 65,
    habitatCost: 250,
    color: '#7CC8A4',
    ground: '#D9F0E2',
    scenery: ['🌴', '🌿', '🍃', '🌺'],
    twist: 'habitat',
    predators: [
      ['tiger', 'monkey'],
      ['snake', 'frog'],
    ],
    terrain: [
      { kind: 'river', name: 'River', emoji: '💧', animals: ['frog', 'snake', 'lizard'] },
      { kind: 'trees', name: 'Treetops', emoji: '🌳', animals: ['monkey', 'parrot', 'sloth', 'bat', 'butterfly', 'snake'] },
    ],
  },
];

export function getBiome(id: string | undefined): Biome {
  return BIOMES.find((b) => b.id === id) ?? BIOMES[0];
}

export interface Level {
  /** e.g. "savanna-3" */
  id: string;
  biome: BiomeId;
  /** 1-based within the biome. */
  number: number;
  size: BoardSize;
  difficulty: Difficulty;
  /** Rule twists in play (each biome introduces its own). */
  twists: Twist[];
  /** Only cells near the selected one are visible. */
  night?: boolean;
  /** A runaway animal hops around until caught. */
  runaway?: boolean;
  /** Final level of a world: time limit in seconds. */
  boss?: { timeLimit: number };
}

type Step = Omit<Level, 'id' | 'biome' | 'number'>;
const step = (size: BoardSize, difficulty: Difficulty, twists: Twist[] = [], extra: Partial<Step> = {}): Step => ({
  size,
  difficulty,
  twists,
  ...extra,
});

// Each world opens gently, introduces its twist, and ends with a boss.
const LADDERS: Record<BiomeId, Step[]> = {
  savanna: [
    step(4, 'easy'),
    step(4, 'medium'),
    step(4, 'medium', ['predator']),
    step(6, 'easy', ['predator']),
    step(6, 'medium', ['predator']),
    step(6, 'hard'),
    step(9, 'easy'),
    step(9, 'easy', ['predator']),
    step(9, 'medium', ['predator']),
    step(9, 'medium', ['predator'], { runaway: true }),
    step(9, 'hard', ['predator']),
    step(9, 'medium', ['predator'], { runaway: true, boss: { timeLimit: 15 * 60 } }),
  ],
  ocean: [
    step(4, 'easy', ['herds']),
    step(4, 'medium', ['herds']),
    step(6, 'easy', ['herds']),
    step(6, 'medium', ['herds']),
    step(6, 'medium', ['herds'], { night: true }),
    step(6, 'hard', ['herds']),
    step(9, 'easy', ['herds']),
    step(9, 'medium', ['herds']),
    step(9, 'medium', ['herds'], { runaway: true }),
    step(9, 'hard', ['herds']),
    step(9, 'hard', ['herds'], { night: true }),
    step(9, 'medium', ['herds'], { night: true, boss: { timeLimit: 15 * 60 } }),
  ],
  arctic: [
    step(4, 'easy', ['jigsaw']),
    step(4, 'medium', ['jigsaw']),
    step(6, 'easy', ['jigsaw']),
    step(6, 'medium', [], { night: true }),
    step(6, 'medium', ['jigsaw']),
    step(6, 'hard', ['jigsaw']),
    step(9, 'easy', ['jigsaw']),
    step(9, 'medium', [], { night: true }),
    step(9, 'medium', ['jigsaw']),
    step(9, 'hard', ['jigsaw']),
    step(9, 'medium', ['jigsaw'], { night: true }),
    step(9, 'medium', ['jigsaw'], { night: true, boss: { timeLimit: 18 * 60 } }),
  ],
  jungle: [
    step(4, 'easy', ['habitat']),
    step(4, 'medium', ['habitat']),
    step(6, 'easy', ['habitat']),
    step(6, 'medium', ['habitat'], { runaway: true }),
    step(6, 'hard', ['habitat']),
    step(9, 'easy', ['habitat']),
    step(9, 'medium', ['habitat']),
    step(9, 'medium', ['habitat'], { runaway: true }),
    step(9, 'hard', ['habitat']),
    step(9, 'hard', ['habitat', 'predator']),
    step(9, 'medium', ['habitat', 'predator'], { night: true }),
    step(9, 'medium', ['habitat', 'predator'], { runaway: true, boss: { timeLimit: 15 * 60 } }),
  ],
};

export const LEVELS_PER_BIOME = 12;

export const LEVELS: Level[] = BIOMES.flatMap((biome) =>
  LADDERS[biome.id].map((s, i) => ({ id: `${biome.id}-${i + 1}`, biome: biome.id, number: i + 1, ...s })),
);

export function getLevel(id: string | undefined): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}

export function levelsInBiome(biome: BiomeId): Level[] {
  return LEVELS.filter((l) => l.biome === biome);
}

export function nextLevel(level: Level): Level | undefined {
  return LEVELS.find((l) => l.biome === level.biome && l.number === level.number + 1);
}

/** Every rule a player needs to know for this level, in display order. */
export function levelRules(level: Pick<Level, 'twists' | 'night' | 'runaway' | 'boss'>): RuleId[] {
  const ids: RuleId[] = [...level.twists];
  if (level.night) ids.push('night');
  if (level.runaway) ids.push('runaway');
  if (level.boss) ids.push('boss');
  return ids;
}

/** Turns a biome's twists (written with animal ids) into engine rules (values) for a board size. */
export function variantSpec(biomeId: BiomeId, twists: Twist[], size: BoardSize): VariantSpec {
  const biome = getBiome(biomeId);
  const animals = BIOME_ANIMALS[biomeId].slice(0, size);
  const value = (id: string) => animals.findIndex((a) => a.id === id) + 1; // 0 = not on this board
  const mask = (ids: string[]) => ids.reduce((m, id) => (value(id) ? m | (1 << value(id)) : m), 0);
  const spec: VariantSpec = {};
  if (twists.includes('jigsaw')) spec.jigsaw = true;
  if (twists.includes('herds')) spec.herds = true;
  if (twists.includes('predator')) {
    spec.forbiddenPairs = biome.predators
      .map(([a, b]) => [value(a), value(b)] as [number, number])
      .filter(([a, b]) => a && b);
  }
  if (twists.includes('habitat')) {
    spec.terrain = biome.terrain.map((t) => ({ kind: t.kind, allowed: mask(t.animals) })).filter((t) => t.allowed);
  }
  return spec;
}

/** Same seed means the same puzzle every time this level is played. */
export function levelPuzzle(level: Level): Puzzle {
  return generatePuzzle(level.size, level.difficulty, seededRng(`level:${level.id}`), variantSpec(level.biome, level.twists, level.size));
}

export function animalsFor(biome: BiomeId): Animal[] {
  return BIOME_ANIMALS[biome];
}

// ---- Daily puzzle ----------------------------------------------------------

/** Local calendar date as YYYY-MM-DD. */
export function dateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number);
  return dateKey(new Date(y, m - 1, d + days));
}

// Gentle early in the week, tougher on the weekend. Index = Date.getDay() (0 = Sunday).
const DAILY_DIFFICULTY: Difficulty[] = ['hard', 'easy', 'easy', 'medium', 'medium', 'medium', 'hard'];

export interface DailyPuzzle {
  date: string;
  biome: BiomeId;
  size: BoardSize;
  difficulty: Difficulty;
  /** Weekend dailies use the biome's twist for a change of pace. */
  twists: Twist[];
  puzzle: Puzzle;
}

export function dailyPuzzle(date: string = dateKey()): DailyPuzzle {
  const [y, m, d] = date.split('-').map(Number);
  const day = new Date(y, m - 1, d);
  const dayNumber = Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  const biome = BIOMES[dayNumber % BIOMES.length].id;
  const difficulty = DAILY_DIFFICULTY[day.getDay()];
  const size: BoardSize = 9;
  const weekend = day.getDay() === 0 || day.getDay() === 6;
  const twists: Twist[] = weekend ? [getBiome(biome).twist] : [];
  const puzzle = generatePuzzle(size, difficulty, seededRng(`daily:${date}`), variantSpec(biome, twists, size));
  return { date, biome, size, difficulty, twists, puzzle };
}
