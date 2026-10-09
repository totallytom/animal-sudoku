import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TerrainKind } from '../lib/biomes';
import { RULES, type RuleId } from '../lib/rules';
import type { Puzzle } from '../lib/sudoku';
import { colors } from '../lib/theme';
import { formatTime } from '../lib/useSudokuGame';
import { AnimalIcon } from './AnimalIcon';

interface Props {
  rules: RuleId[];
  puzzle: Puzzle;
  terrain: TerrainKind[];
  /** Seconds left on a boss clock. */
  timeLeft: number | null;
  runaway: { secondsLeft: number } | null;
  caught: number;
  width: number;
  onHelp: () => void;
}

/** Compact reminder of this level's special rules, above the board. Tap for the full explanation. */
export function RuleBar({ rules, puzzle, terrain, timeLeft, runaway, caught, width, onHelp }: Props) {
  if (!rules.length) return null;
  const n = puzzle.layout.size;

  return (
    <Pressable
      onPress={onHelp}
      style={[styles.bar, { width }]}
      accessibilityRole="button"
      accessibilityLabel="Level rules. Tap for details."
    >
      {rules.includes('boss') && timeLeft !== null ? (
        <View style={[styles.chip, styles.boss, timeLeft <= 60 && styles.urgent]}>
          <Text style={styles.chipText}>
            👑 ⏳ {formatTime(timeLeft)}
            {timeLeft <= 60 ? ' !' : ''}
          </Text>
        </View>
      ) : null}

      {puzzle.rules.forbiddenPairs?.map(([a, b]) =>
        a <= n && b <= n ? (
          <View key={`${a}-${b}`} style={styles.chip} accessibilityLabel="can't touch">
            <AnimalIcon value={a} size={18} />
            <Text style={styles.noTouch}>⇎</Text>
            <AnimalIcon value={b} size={18} />
          </View>
        ) : null,
      )}

      {rules.includes('habitat')
        ? terrain
            .filter((t) => puzzle.rules.terrain?.allowed[t.kind])
            .map((t) => {
              const mask = puzzle.rules.terrain!.allowed[t.kind];
              return (
                <View key={t.kind} style={styles.chip}>
                  <Text style={styles.chipText}>{t.emoji}</Text>
                  {Array.from({ length: n }, (_, k) => k + 1)
                    .filter((v) => mask & (1 << v))
                    .map((v) => (
                      <AnimalIcon key={v} value={v} size={18} />
                    ))}
                </View>
              );
            })
        : null}

      {rules.includes('herds') ? <Chip text={`${RULES.herds.emoji} Pods: fill each with its animals`} /> : null}
      {rules.includes('jigsaw') ? <Chip text={`${RULES.jigsaw.emoji} Ice floes replace boxes`} /> : null}
      {rules.includes('night') ? <Chip text={`${RULES.night.emoji} Tap to move your lantern`} /> : null}
      {rules.includes('runaway') ? (
        <Chip text={runaway ? `🏃 Catch it! ${runaway.secondsLeft}s · caught ${caught}` : `🏃 Caught ${caught}`} />
      ) : null}

      <View style={styles.help}>
        <Text style={styles.helpText}>?</Text>
      </View>
    </Pressable>
  );
}

function Chip({ text }: { text: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.thinBorder,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  noTouch: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.text,
    marginHorizontal: 2,
  },
  boss: {
    borderWidth: 2,
    borderColor: colors.text,
  },
  urgent: {
    // Urgency by shape (thick dashed outline), not color alone.
    borderStyle: 'dashed',
    borderWidth: 3,
  },
  help: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
  },
});
