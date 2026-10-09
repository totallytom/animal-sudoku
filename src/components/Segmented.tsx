import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../lib/theme';

interface Props<T extends string | number> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

export function Segmented<T extends string | number>({ options, value, onChange, disabled }: Props<T>) {
  return (
    <View style={[styles.segment, disabled && { opacity: 0.4 }]}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            disabled={disabled}
            style={[styles.item, active && styles.itemActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active, disabled }}
          >
            <Text style={[styles.text, active && styles.textActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.thinBorder,
  },
  item: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  itemActive: {
    backgroundColor: colors.text,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  textActive: {
    color: '#fff',
  },
});
