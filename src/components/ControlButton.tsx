import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '../lib/theme';

interface Props {
  label: string;
  icon: string;
  onPress: () => void;
  disabled?: boolean;
  active?: boolean;
}

export function ControlButton({ label, icon, onPress, disabled, active }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.control,
        active && styles.controlActive,
        (pressed || disabled) && { opacity: disabled ? 0.4 : 0.7 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected: active }}
    >
      <Text style={[styles.icon, active && styles.textActive]}>{icon}</Text>
      <Text style={[styles.label, active && styles.textActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  control: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.thinBorder,
  },
  controlActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  icon: {
    fontSize: 18,
    color: colors.text,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
  },
  textActive: {
    color: '#fff',
  },
});
