import { StyleSheet, Text, View } from 'react-native';

import { useProgress } from '../lib/progress';
import { colors } from '../lib/theme';

export function CurrencyBar() {
  const { progress, stars, streak } = useProgress();
  return (
    <View style={styles.bar}>
      <Pill icon="🪙" value={progress.coins} label="coins" />
      <Pill icon="⭐" value={stars} label="stars" />
      <Pill icon="🔥" value={streak} label="day streak" />
    </View>
  );
}

function Pill({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <View style={styles.pill} accessibilityLabel={`${value} ${label}`}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.thinBorder,
  },
  icon: {
    fontSize: 16,
  },
  value: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
});
