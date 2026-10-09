import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAnimals } from '../lib/animals';
import { colors } from '../lib/theme';
import { AnimalIcon } from './AnimalIcon';

interface Props {
  size: number;
  /** How many of each value (index = value) are already on the board. */
  counts: number[];
  width: number;
  /** Tint buttons with each animal's color (off in colorblind mode). */
  tinted: boolean;
  showBadges: boolean;
  onPick: (value: number) => void;
}

export function AnimalPicker({ size, counts, width, tinted, showBadges, onPick }: Props) {
  const animals = useAnimals();
  // Put 9 animals on two rows (5 + 4); 4 and 6 animals fit on one row.
  const perRow = size === 9 ? 5 : size;
  const gap = 8;
  const buttonSize = Math.min(72, (width - gap * (perRow - 1)) / perRow);

  return (
    <View style={[styles.wrap, { width, gap }]}>
      {Array.from({ length: size }, (_, k) => k + 1).map((v) => {
        const done = counts[v] >= size;
        return (
          <Pressable
            key={v}
            onPress={() => onPick(v)}
            disabled={done}
            accessibilityRole="button"
            accessibilityLabel={`${animals[v - 1].name}, ${done ? 'all placed' : `${size - counts[v]} left`}`}
            style={({ pressed }) => [
              styles.button,
              {
                width: buttonSize,
                height: buttonSize,
                backgroundColor: tinted ? animals[v - 1].color : colors.surface,
                transform: [{ scale: pressed ? 0.92 : 1 }],
              },
            ]}
          >
            <AnimalIcon value={v} size={buttonSize * 0.62} dimmed={done} badge={showBadges} />
            <Text style={styles.remaining}>{done ? '✓' : size - counts[v]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  button: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(59,47,42,0.15)',
  },
  remaining: {
    position: 'absolute',
    top: 3,
    right: 6,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
});
