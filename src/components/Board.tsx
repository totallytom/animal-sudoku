import { memo, useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAnimals } from '../lib/animals';
import { useReducedMotion } from '../lib/motion';
import type { PlayerStyle } from '../lib/players';
import { isPeer, type Cage, type Puzzle } from '../lib/sudoku';
import { colors, type BoardPalette } from '../lib/theme';
import { AnimalIcon } from './AnimalIcon';

export interface RunawayView {
  cell: number;
  value: number;
  secondsLeft: number;
}

interface Props {
  puzzle: Puzzle;
  grid: number[];
  given: boolean[];
  notes: number[];
  selected: number | null;
  wrong: Set<number>;
  highlightMatching: boolean;
  showBadges: boolean;
  palette: BoardPalette;
  /** Optional per-cell owner marker (Shared-board battles). */
  markers?: (PlayerStyle | null)[];
  /** Cells to celebrate (completed row/column/box, or the whole board on a win). New `id` = play again. */
  celebration?: { cells: number[]; id: number } | null;
  /** Emoji per terrain kind (habitat levels). */
  terrainIcons?: Record<string, string>;
  /** Night mode: only these cells are lit. Undefined = everything visible. */
  visible?: Set<number>;
  runaway?: RunawayView | null;
  width: number;
  onSelect: (index: number) => void;
}

const THICK = 2;

export function Board({
  puzzle,
  grid,
  given,
  notes,
  selected,
  wrong,
  highlightMatching,
  showBadges,
  palette,
  markers,
  celebration,
  terrainIcons,
  visible,
  runaway,
  width,
  onSelect,
}: Props) {
  const animals = useAnimals();
  const reducedMotion = useReducedMotion();
  const { layout, regions, rules } = puzzle;
  const n = layout.size;
  const cellSize = (width - 4) / n; // 2px outer border on each side
  const selectedValue = selected !== null ? grid[selected] : 0;

  // Ripple outward: each celebrated cell waits a bit longer than the previous one.
  const celebrateOrder = new Map<number, number>();
  celebration?.cells.forEach((cell, k) => celebrateOrder.set(cell, k));

  const cageOf = useMemo(() => {
    const map = new Array<number>(n * n).fill(-1);
    rules.cages?.forEach((cage, k) => cage.cells.forEach((i) => (map[i] = k)));
    return map;
  }, [rules, n]);

  return (
    <View style={[styles.board, { width, height: width }]}>
      {Array.from({ length: n }, (_, r) => (
        <View key={r} style={styles.row}>
          {Array.from({ length: n }, (_, c) => {
            const i = r * n + c;
            const value = grid[i];
            const cage = cageOf[i];
            const sameCage = (j: number) => cage >= 0 && cageOf[j] === cage;
            return (
              <Cell
                key={c}
                index={i}
                row={r}
                col={c}
                value={value}
                animalName={value ? animals[value - 1].name : 'empty'}
                tint={value && palette.animalTints ? animals[value - 1].color : null}
                given={given[i]}
                noteMask={notes[i]}
                size={cellSize}
                noteCols={layout.boxCols}
                isSelected={i === selected}
                isPeer={selected !== null && i !== selected && isPeer(puzzle, selected, i)}
                isMatching={highlightMatching && !!selectedValue && i !== selected && value === selectedValue}
                isWrong={wrong.has(i)}
                showBadge={showBadges}
                palette={palette}
                marker={markers?.[i] ?? null}
                terrain={rules.terrain?.cells[i] ? (terrainIcons?.[rules.terrain.cells[i]!] ?? '◆') : null}
                cageEdges={
                  cage < 0
                    ? null
                    : {
                        top: r === 0 || !sameCage(i - n),
                        bottom: r === n - 1 || !sameCage(i + n),
                        left: c === 0 || !sameCage(i - 1),
                        right: c === n - 1 || !sameCage(i + 1),
                      }
                }
                cageLabel={cage >= 0 && rules.cages![cage].cells[0] === i ? rules.cages![cage] : null}
                dark={visible ? !visible.has(i) : false}
                runaway={runaway && runaway.cell === i && (!visible || visible.has(i)) ? runaway : null}
                celebrateId={!reducedMotion && celebration && celebrateOrder.has(i) ? celebration.id : 0}
                celebrateDelay={(celebrateOrder.get(i) ?? 0) * (celebration && celebration.cells.length > 27 ? 12 : 35)}
                // Thick lines wherever the region (box or ice floe) changes.
                borderRight={c < n - 1 ? (regions[i] !== regions[i + 1] ? THICK : StyleSheet.hairlineWidth) : 0}
                borderBottom={r < n - 1 ? (regions[i] !== regions[i + n] ? THICK : StyleSheet.hairlineWidth) : 0}
                maxValue={n}
                onSelect={onSelect}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

interface CellProps {
  index: number;
  row: number;
  col: number;
  value: number;
  animalName: string;
  tint: string | null;
  given: boolean;
  noteMask: number;
  size: number;
  noteCols: number;
  isSelected: boolean;
  isPeer: boolean;
  isMatching: boolean;
  isWrong: boolean;
  showBadge: boolean;
  palette: BoardPalette;
  marker: PlayerStyle | null;
  terrain: string | null;
  cageEdges: { top: boolean; bottom: boolean; left: boolean; right: boolean } | null;
  cageLabel: Cage | null;
  dark: boolean;
  runaway: RunawayView | null;
  celebrateId: number;
  celebrateDelay: number;
  borderRight: number;
  borderBottom: number;
  maxValue: number;
  onSelect: (index: number) => void;
}

const Cell = memo(function Cell({
  index,
  row,
  col,
  value,
  animalName,
  tint,
  given,
  noteMask,
  size,
  noteCols,
  isSelected,
  isPeer,
  isMatching,
  isWrong,
  showBadge,
  palette,
  marker,
  terrain,
  cageEdges,
  cageLabel,
  dark,
  runaway,
  celebrateId,
  celebrateDelay,
  borderRight,
  borderBottom,
  maxValue,
  onSelect,
}: CellProps) {
  const [pop] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!celebrateId) return;
    pop.setValue(0);
    Animated.sequence([
      Animated.delay(celebrateDelay),
      Animated.timing(pop, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.spring(pop, { toValue: 0, friction: 4, tension: 120, useNativeDriver: true }),
    ]).start();
  }, [celebrateId, celebrateDelay, pop]);

  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] });
  const glow = pop.interpolate({ inputRange: [0, 1], outputRange: [0, 0.65], extrapolate: 'clamp' });

  const lineColor = (w: number) => (w === THICK ? colors.border : colors.thinBorder);
  const noteSize = (size - 4) / noteCols;

  let background = colors.surface;
  if (tint) background = tint;
  if (isPeer) background = palette.peer;
  if (isMatching) background = palette.matching;
  if (isWrong) background = palette.errorBg;
  if (isSelected) background = palette.selected;

  // The ring around an animal carries meaning by line style, not just color:
  // solid red/orange = wrong, solid thick = matching, dashed = placed by player.
  let ring = null;
  if (value) {
    if (isWrong) ring = { borderColor: palette.error, borderStyle: 'solid' as const, borderWidth: 2 };
    else if (isMatching) ring = { borderColor: palette.matchingRing, borderStyle: 'solid' as const, borderWidth: 2.5 };
    else if (!given) ring = { borderColor: 'rgba(59,47,42,0.35)', borderStyle: 'dashed' as const, borderWidth: 1.5 };
  }

  const label = dark
    ? `Row ${row + 1}, column ${col + 1}, dark`
    : `Row ${row + 1}, column ${col + 1}, ${animalName}${given ? ', given' : ''}${isWrong ? ', wrong' : ''}${
        terrain ? ', habitat square' : ''
      }${cageLabel ? `, pod start` : ''}${runaway ? ', runaway animal here' : ''}`;

  return (
    <Pressable
      onPress={() => onSelect(index)}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: isSelected }}
      style={{
        width: size,
        height: size,
        backgroundColor: background,
        borderRightWidth: borderRight,
        borderBottomWidth: borderBottom,
        borderRightColor: lineColor(borderRight),
        borderBottomColor: lineColor(borderBottom),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Habitat watermark on empty squares */}
      {terrain && !value ? <Text style={[styles.terrainMark, { fontSize: size * 0.55 }]}>{terrain}</Text> : null}

      {/* Golden glow behind the animal during a celebration. */}
      <Animated.View pointerEvents="none" style={[styles.glow, { opacity: glow }]} />
      {value ? (
        <Animated.View style={[styles.valueWrap, ring, { transform: [{ scale }] }]}>
          <AnimalIcon value={value} size={size * (cageLabel ? 0.62 : 0.74)} badge={showBadge} />
        </Animated.View>
      ) : noteMask ? (
        <View style={[styles.notes, { width: size - 4 }]}>
          {Array.from({ length: maxValue }, (_, k) => k + 1).map((v) => (
            <View key={v} style={{ width: noteSize, height: noteSize, alignItems: 'center', justifyContent: 'center' }}>
              {noteMask & (1 << v) ? <AnimalIcon value={v} size={noteSize * 0.9} /> : null}
            </View>
          ))}
        </View>
      ) : null}

      {terrain && value ? <Text style={[styles.terrainCorner, { fontSize: Math.max(8, size * 0.22) }]}>{terrain}</Text> : null}

      {cageEdges ? <CageOutline edges={cageEdges} size={size} /> : null}
      {cageLabel ? (
        <View style={styles.cageLabel}>
          {cageLabel.values.map((v) => (
            <AnimalIcon key={v} value={v} size={Math.max(9, size * 0.22)} />
          ))}
        </View>
      ) : null}

      {isWrong ? (
        <View style={[styles.wrongBadge, { backgroundColor: palette.error }]}>
          <Text style={styles.wrongBadgeText}>✕</Text>
        </View>
      ) : null}

      {marker ? (
        <Text style={[styles.marker, { color: marker.color, fontSize: Math.max(9, size * 0.24) }]}>{marker.symbol}</Text>
      ) : null}

      {runaway ? <RunawayMarker runaway={runaway} size={size} /> : null}

      {dark ? (
        <View pointerEvents="none" style={styles.night}>
          <Text style={{ fontSize: size * 0.25, opacity: 0.25 }}>✦</Text>
        </View>
      ) : null}

      {/* Selected cell gets a thick outline so it stands out without color. */}
      {isSelected ? <View pointerEvents="none" style={[styles.selectedOutline, { borderColor: palette.selectedOutline }]} /> : null}
    </Pressable>
  );
});

/** Dashed pod outline drawn from small segments (iOS can't dash individual sides). */
function CageOutline({ edges, size }: { edges: NonNullable<CellProps['cageEdges']>; size: number }) {
  const inset = 3;
  const length = size - inset * 2;
  const dashes = 4;
  const dash = length / (dashes * 2 - 1);
  const segments: { left: number; top: number; width: number; height: number }[] = [];
  for (let k = 0; k < dashes; k++) {
    const offset = inset + k * dash * 2;
    if (edges.top) segments.push({ left: offset, top: inset, width: dash, height: 1.5 });
    if (edges.bottom) segments.push({ left: offset, top: size - inset - 1.5, width: dash, height: 1.5 });
    if (edges.left) segments.push({ left: inset, top: offset, width: 1.5, height: dash });
    if (edges.right) segments.push({ left: size - inset - 1.5, top: offset, width: 1.5, height: dash });
  }
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {segments.map((s, k) => (
        <View key={k} style={[styles.cageDash, s]} />
      ))}
    </View>
  );
}

function RunawayMarker({ runaway, size }: { runaway: RunawayView; size: number }) {
  const reducedMotion = useReducedMotion();
  const [bob] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reducedMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 280, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.delay(500),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bob, reducedMotion]);

  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.15] });
  const urgent = runaway.secondsLeft <= 10;
  return (
    <View pointerEvents="none" style={styles.runaway}>
      <Animated.View style={{ opacity: 0.6, transform: [{ translateY }] }}>
        <AnimalIcon value={runaway.value} size={size * 0.62} />
      </Animated.View>
      <View style={[styles.runawayTimer, urgent && styles.runawayUrgent]}>
        <Text style={[styles.runawayText, { fontSize: Math.max(8, size * 0.2) }]}>{runaway.secondsLeft}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: 'row',
  },
  valueWrap: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  notes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  terrainMark: {
    position: 'absolute',
    opacity: 0.35,
  },
  terrainCorner: {
    position: 'absolute',
    bottom: 1,
    left: 2,
  },
  cageDash: {
    position: 'absolute',
    backgroundColor: colors.text,
    opacity: 0.7,
  },
  cageLabel: {
    position: 'absolute',
    top: 4,
    left: 4,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 4,
    paddingHorizontal: 1,
  },
  wrongBadge: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrongBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
    includeFontPadding: false,
  },
  marker: {
    position: 'absolute',
    top: 0,
    right: 2,
    fontWeight: '900',
    includeFontPadding: false,
  },
  glow: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FFD54A',
  },
  night: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#1D2342',
    alignItems: 'center',
    justifyContent: 'center',
  },
  runaway: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runawayTimer: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    minWidth: 14,
    paddingHorizontal: 2,
    borderRadius: 7,
    backgroundColor: colors.text,
    alignItems: 'center',
  },
  runawayUrgent: {
    // Urgency shown by shape too: a bright outline, not just a color change.
    borderWidth: 1.5,
    borderColor: '#FFD54A',
  },
  runawayText: {
    color: '#fff',
    fontWeight: '900',
    includeFontPadding: false,
  },
  selectedOutline: {
    ...StyleSheet.absoluteFill,
    borderWidth: 3,
    borderRadius: 2,
  },
});
