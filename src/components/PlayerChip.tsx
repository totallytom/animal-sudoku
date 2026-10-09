import { StyleSheet, Text, View } from 'react-native';

import { PLAYER_STYLES } from '../lib/players';
import { colors } from '../lib/theme';

interface Props {
  index: number;
  name: string;
  detail?: string;
  /** Current player: thick border + filled symbol background (not color alone). */
  active?: boolean;
}

export function PlayerChip({ index, name, detail, active }: Props) {
  const style = PLAYER_STYLES[index];
  return (
    <View
      style={[styles.chip, active && { borderColor: style.color, borderWidth: 3 }]}
      accessibilityLabel={`${name}${detail ? `, ${detail}` : ''}${active ? ', current turn' : ''}`}
    >
      <View style={[styles.symbolWrap, { borderColor: style.color }, active && { backgroundColor: style.color }]}>
        <Text style={[styles.symbol, { color: active ? '#fff' : style.color }]}>{style.symbol}</Text>
      </View>
      <View style={styles.text}>
        <Text style={[styles.name, active && styles.nameActive]} numberOfLines={1}>
          {name}
        </Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      </View>
    </View>
  );
}

export function PlayerSymbol({ index, size }: { index: number; size: number }) {
  const style = PLAYER_STYLES[index];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: style.color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#fff', fontSize: size * 0.5, fontWeight: '900', includeFontPadding: false }}>
        {style.symbol}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.thinBorder,
    backgroundColor: colors.surface,
    flexShrink: 1,
  },
  symbolWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: {
    fontSize: 13,
    fontWeight: '900',
    includeFontPadding: false,
  },
  text: {
    flexShrink: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  nameActive: {
    fontWeight: '800',
  },
  detail: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
