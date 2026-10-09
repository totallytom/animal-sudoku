// Sudoku engine for 4x4 (2x2 boxes), 6x6 (2x3 boxes) and 9x9 (3x3 boxes),
// plus animal rule variants:
//   - jigsaw regions ("ice floes") instead of boxes
//   - forbidden neighbor pairs ("predator & prey": the lion can't touch the zebra)
//   - terrain cells that only accept certain animals (river, treetops)
//   - cages ("herds"/"pods") that hold exactly the listed animals
// Values are 1..size; 0 means empty. Grids are flat arrays of length size*size.

import type { Rng } from './random';

export type BoardSize = 4 | 6 | 9;
export type Difficulty = 'easy' | 'medium' | 'hard';

export const DIFFICULTY_LABEL: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

/** Board size from a route param; anything unexpected becomes 9. */
export function parseSize(raw: string | undefined): BoardSize {
  return raw === '4' || raw === '6' ? (Number(raw) as BoardSize) : 9;
}

export function parseDifficulty(raw: string | undefined): Difficulty {
  return raw === 'medium' || raw === 'hard' ? raw : 'easy';
}

export interface Layout {
  size: BoardSize;
  boxRows: number;
  boxCols: number;
}

export interface Cage {
  cells: number[];
  /** The animals (values) this herd holds, in no particular order. */
  values: number[];
}

export interface PuzzleRules {
  /** Pairs of values that may never sit orthogonally next to each other. */
  forbiddenPairs?: [number, number][];
  /** Terrain kind per cell (null = plain ground) and the values each kind accepts (bitmask). */
  terrain?: { cells: (string | null)[]; allowed: Record<string, number> };
  cages?: Cage[];
}

export interface Puzzle {
  layout: Layout;
  /** Region id per cell: the normal boxes, or irregular jigsaw regions. */
  regions: number[];
  puzzle: number[];
  solution: number[];
  rules: PuzzleRules;
}

/** What to generate on top of plain sudoku. */
export interface VariantSpec {
  jigsaw?: boolean;
  forbiddenPairs?: [number, number][];
  /** Terrain kinds to scatter, each with the values (bitmask) it accepts. */
  terrain?: { kind: string; allowed: number }[];
  herds?: boolean;
}

export function getLayout(size: BoardSize): Layout {
  switch (size) {
    case 4:
      return { size, boxRows: 2, boxCols: 2 };
    case 6:
      return { size, boxRows: 2, boxCols: 3 };
    case 9:
      return { size, boxRows: 3, boxCols: 3 };
  }
}

// Number of pre-filled cells per board size and difficulty.
const CLUES: Record<BoardSize, Record<Difficulty, number>> = {
  4: { easy: 10, medium: 8, hard: 6 },
  6: { easy: 22, medium: 17, hard: 13 },
  9: { easy: 40, medium: 32, hard: 26 },
};

// Extra rules are clues too, so variant puzzles can start with fewer animals.
const VARIANT_CLUE_FACTOR = 0.85;

// Search budget per solve. Hitting it counts as "not unique / not solvable",
// so generation never hangs on a pathological layout.
const NODE_LIMIT = 60000;

export function boxIndex(layout: Layout, row: number, col: number): number {
  const boxesPerRow = layout.size / layout.boxCols;
  return Math.floor(row / layout.boxRows) * boxesPerRow + Math.floor(col / layout.boxCols);
}

function boxRegions(layout: Layout): number[] {
  const n = layout.size;
  return Array.from({ length: n * n }, (_, i) => boxIndex(layout, Math.floor(i / n), i % n));
}

function shuffle<T>(items: T[], rng: Rng = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function orthogonalNeighbors(n: number, i: number): number[] {
  const r = Math.floor(i / n);
  const c = i % n;
  const out: number[] = [];
  if (r > 0) out.push(i - n);
  if (r < n - 1) out.push(i + n);
  if (c > 0) out.push(i - 1);
  if (c < n - 1) out.push(i + 1);
  return out;
}

const popcount = (m: number) => {
  let bits = 0;
  for (; m; m &= m - 1) bits++;
  return bits;
};

// ---- Constraint model --------------------------------------------------------

interface Model {
  n: number;
  full: number;
  /** All-different groups: rows, columns, regions, cages. */
  units: number[][];
  cellUnits: number[][];
  /** Values allowed in each cell (terrain, cages). */
  cellMask: number[];
  /** forbid[v] = values that may not sit next to v. All zeros when unused. */
  forbid: number[];
  neighbors: number[][];
  hasForbid: boolean;
}

function buildModel(layout: Layout, regions: number[], rules: PuzzleRules): Model {
  const n = layout.size;
  const full = ((1 << (n + 1)) - 1) & ~1; // bits 1..n
  const units: number[][] = [];
  for (let r = 0; r < n; r++) units.push(Array.from({ length: n }, (_, c) => r * n + c));
  for (let c = 0; c < n; c++) units.push(Array.from({ length: n }, (_, r) => r * n + c));
  for (let g = 0; g < n; g++) units.push(regions.flatMap((reg, i) => (reg === g ? [i] : [])));

  const cellMask = new Array(n * n).fill(full);
  for (const cage of rules.cages ?? []) {
    units.push(cage.cells);
    const mask = cage.values.reduce((m, v) => m | (1 << v), 0);
    cage.cells.forEach((i) => (cellMask[i] &= mask));
  }
  if (rules.terrain) {
    rules.terrain.cells.forEach((kind, i) => {
      if (kind) cellMask[i] &= rules.terrain!.allowed[kind];
    });
  }

  const cellUnits: number[][] = Array.from({ length: n * n }, () => []);
  units.forEach((unit, u) => unit.forEach((i) => cellUnits[i].push(u)));

  const forbid = new Array(n + 1).fill(0);
  for (const [a, b] of rules.forbiddenPairs ?? []) {
    if (a > n || b > n) continue;
    forbid[a] |= 1 << b;
    forbid[b] |= 1 << a;
  }
  const hasForbid = forbid.some(Boolean);
  const neighbors = Array.from({ length: n * n }, (_, i) => orthogonalNeighbors(n, i));
  return { n, full, units, cellUnits, cellMask, forbid, neighbors, hasForbid };
}

function candidatesFor(model: Model, grid: number[], unitUsed: number[], i: number): number {
  let mask = model.cellMask[i];
  for (const u of model.cellUnits[i]) mask &= ~unitUsed[u];
  if (model.hasForbid) {
    for (const nb of model.neighbors[i]) if (grid[nb]) mask &= ~model.forbid[grid[nb]];
  }
  return mask;
}

function usedMasks(model: Model, grid: number[]): number[] {
  return model.units.map((unit) => unit.reduce((m, i) => (grid[i] ? m | (1 << grid[i]) : m), 0));
}

/**
 * Backtracking solver using "fewest candidates first". Counts solutions up to
 * `limit`. With `rng`, candidate order is shuffled (random full grids).
 * Fills `grid` with the first solution found. `aborted` means the search
 * budget ran out before an answer.
 */
function solve(model: Model, grid: number[], limit: number, rng: Rng | null): { count: number; aborted: boolean } {
  const unitUsed = usedMasks(model, grid);
  const total = model.n * model.n;
  let count = 0;
  let nodes = 0;
  let aborted = false;
  let firstSolution: number[] | null = null;

  const recurse = (): boolean => {
    if (++nodes > NODE_LIMIT) {
      aborted = true;
      return true;
    }
    let best = -1;
    let bestMask = 0;
    let bestCount = 99;
    for (let i = 0; i < total; i++) {
      if (grid[i]) continue;
      const mask = candidatesFor(model, grid, unitUsed, i);
      const bits = popcount(mask);
      if (bits < bestCount) {
        best = i;
        bestMask = mask;
        bestCount = bits;
        if (bits <= 1) break;
      }
    }
    if (best === -1) {
      count++;
      if (!firstSolution) firstSolution = [...grid];
      return count >= limit;
    }
    if (bestCount === 0) return false;

    let candidates: number[] = [];
    for (let v = 1; v <= model.n; v++) if (bestMask & (1 << v)) candidates.push(v);
    if (rng) candidates = shuffle(candidates, rng);

    const myUnits = model.cellUnits[best];
    for (const v of candidates) {
      const bit = 1 << v;
      grid[best] = v;
      for (const u of myUnits) unitUsed[u] |= bit;
      const done = recurse();
      grid[best] = 0;
      for (const u of myUnits) unitUsed[u] &= ~bit;
      if (done) return true;
    }
    return false;
  };

  recurse();
  if (firstSolution) {
    const sol: number[] = firstSolution;
    for (let i = 0; i < sol.length; i++) grid[i] = sol[i];
  }
  return { count, aborted };
}

// ---- Variant builders --------------------------------------------------------

/** Irregular regions made by trading cells between neighboring boxes while keeping every region connected. */
function jigsawRegions(layout: Layout, rng: Rng): number[] {
  const n = layout.size;
  const regions = boxRegions(layout);
  const connected = (g: number) => {
    const cells = regions.flatMap((r, i) => (r === g ? [i] : []));
    const seen = new Set([cells[0]]);
    const stack = [cells[0]];
    while (stack.length) {
      const i = stack.pop()!;
      for (const nb of orthogonalNeighbors(n, i)) {
        if (regions[nb] === g && !seen.has(nb)) {
          seen.add(nb);
          stack.push(nb);
        }
      }
    }
    return seen.size === cells.length;
  };

  for (let attempt = 0; attempt < n * n * 6; attempt++) {
    const a = Math.floor(rng() * n * n);
    const ra = regions[a];
    const others = orthogonalNeighbors(n, a).filter((nb) => regions[nb] !== ra);
    if (!others.length) continue;
    const rb = regions[others[Math.floor(rng() * others.length)]];
    // A cell of region B that touches region A, to swap back so sizes stay equal.
    const swaps = regions.flatMap((r, i) =>
      r === rb && orthogonalNeighbors(n, i).some((nb) => regions[nb] === ra && nb !== a) ? [i] : [],
    );
    if (!swaps.length) continue;
    const b = swaps[Math.floor(rng() * swaps.length)];
    regions[a] = rb;
    regions[b] = ra;
    if (!connected(ra) || !connected(rb)) {
      regions[a] = ra;
      regions[b] = rb;
    }
  }
  return regions;
}

/** Herds: small connected groups (2-3 cells) of different animals. About half the board gets caged. */
function buildCages(n: number, solution: number[], rng: Rng): Cage[] {
  const caged = new Array(n * n).fill(false);
  const cages: Cage[] = [];
  for (const start of shuffle([...solution.keys()], rng)) {
    if (caged[start] || rng() < 0.45) continue;
    const target = rng() < 0.5 ? 2 : 3;
    const cells = [start];
    caged[start] = true;
    while (cells.length < target) {
      const frontier = cells.flatMap((i) =>
        orthogonalNeighbors(n, i).filter((nb) => !caged[nb] && !cells.some((c) => solution[c] === solution[nb])),
      );
      if (!frontier.length) break;
      const next = frontier[Math.floor(rng() * frontier.length)];
      cells.push(next);
      caged[next] = true;
    }
    if (cells.length < 2) {
      caged[start] = false;
      continue;
    }
    cells.sort((a, b) => a - b);
    cages.push({ cells, values: cells.map((i) => solution[i]).sort((a, b) => a - b) });
  }
  return cages;
}

const TERRAIN_CELLS: Record<BoardSize, number> = { 4: 3, 6: 6, 9: 12 };

function buildTerrain(size: BoardSize, solution: number[], kinds: { kind: string; allowed: number }[], rng: Rng): PuzzleRules['terrain'] {
  const cells: (string | null)[] = new Array(solution.length).fill(null);
  const allowed: Record<string, number> = {};
  kinds.forEach((k) => (allowed[k.kind] = k.allowed));
  const perKind = Math.ceil(TERRAIN_CELLS[size] / kinds.length);
  for (const { kind, allowed: mask } of kinds) {
    const fits = shuffle(
      solution.flatMap((v, i) => (cells[i] === null && mask & (1 << v) ? [i] : [])),
      rng,
    );
    fits.slice(0, perKind).forEach((i) => (cells[i] = kind));
  }
  return { cells, allowed };
}

// ---- Generation --------------------------------------------------------------

/**
 * Pass a seeded `rng` to get the same puzzle every time (levels, daily puzzle).
 * Variant rules are generated with the solution so they are always satisfiable,
 * then clues are removed while the puzzle stays uniquely solvable under all rules.
 */
export function generatePuzzle(size: BoardSize, difficulty: Difficulty, rng: Rng = Math.random, variant: VariantSpec = {}): Puzzle {
  const layout = getLayout(size);
  const n = size;

  for (let attempt = 0; attempt < 40; attempt++) {
    const regions = variant.jigsaw ? jigsawRegions(layout, rng) : boxRegions(layout);
    const baseRules: PuzzleRules = variant.forbiddenPairs?.length ? { forbiddenPairs: variant.forbiddenPairs } : {};
    const solution = new Array(n * n).fill(0);
    const filled = solve(buildModel(layout, regions, baseRules), solution, 1, rng);
    if (filled.count < 1 || filled.aborted) continue; // unlucky layout, try another

    const rules: PuzzleRules = { ...baseRules };
    if (variant.herds) rules.cages = buildCages(n, solution, rng);
    if (variant.terrain?.length) rules.terrain = buildTerrain(size, solution, variant.terrain, rng);
    const model = buildModel(layout, regions, rules);

    const hasRules = !!(variant.jigsaw || rules.forbiddenPairs || rules.cages || rules.terrain);
    const target = Math.round(CLUES[size][difficulty] * (hasRules ? VARIANT_CLUE_FACTOR : 1));
    const puzzle = [...solution];
    let clues = puzzle.length;
    for (const i of shuffle([...puzzle.keys()], rng)) {
      if (clues <= target) break;
      const saved = puzzle[i];
      puzzle[i] = 0;
      const result = solve(model, [...puzzle], 2, null);
      if (result.count === 1 && !result.aborted) clues--;
      else puzzle[i] = saved;
    }
    return { layout, regions, puzzle, solution, rules };
  }
  throw new Error(`Could not generate a ${size}x${size} puzzle for these rules`);
}

// ---- Helpers for the UI --------------------------------------------------------

const modelCache = new WeakMap<Puzzle, Model>();
function modelFor(p: Puzzle): Model {
  let m = modelCache.get(p);
  if (!m) {
    m = buildModel(p.layout, p.regions, p.rules);
    modelCache.set(p, m);
  }
  return m;
}

/**
 * Candidate bitmask (bit v set = value v possible) for every empty cell,
 * honoring every rule of the puzzle. Filled cells get 0.
 */
export function computeCandidates(p: Puzzle, grid: number[]): number[] {
  const model = modelFor(p);
  const used = usedMasks(model, grid);
  return grid.map((v, i) => (v ? 0 : candidatesFor(model, grid, used, i)));
}

/** True if a valid full grid: all units distinct, all cell masks and neighbor rules respected. */
export function isValidSolution(p: Puzzle, grid: number[]): boolean {
  const model = modelFor(p);
  if (grid.some((v, i) => !v || !(model.cellMask[i] & (1 << v)))) return false;
  if (!model.units.every((u) => new Set(u.map((i) => grid[i])).size === u.length)) return false;
  return grid.every((v, i) => model.neighbors[i].every((nb) => !(model.forbid[v] & (1 << grid[nb]))));
}

/**
 * Rows, columns, regions and herds containing `cell` that are now completely
 * and correctly filled. Returns their cells (for celebrations).
 */
export function completedUnits(p: Puzzle, grid: number[], cell: number): number[] {
  const model = modelFor(p);
  const cells = new Set<number>();
  for (const u of model.cellUnits[cell]) {
    const unit = model.units[u];
    if (unit.every((i) => grid[i] === p.solution[i])) unit.forEach((i) => cells.add(i));
  }
  return [...cells];
}

/** True if cells a and b share a row, column, region or herd (an animal can appear only once among them). */
export function isPeer(p: Puzzle, a: number, b: number): boolean {
  const model = modelFor(p);
  return model.cellUnits[a].some((u) => model.cellUnits[b].includes(u));
}
