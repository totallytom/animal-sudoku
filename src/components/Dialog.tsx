import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../lib/theme';

export function Dialog({ visible, children }: { visible: boolean; children: ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>{children}</View>
      </View>
    </Modal>
  );
}

export function DialogTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function DialogText({ children }: { children: ReactNode }) {
  return <Text style={styles.text}>{children}</Text>;
}

export function DialogButton({ label, primary, onPress }: { label: string; primary?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, primary && styles.buttonPrimary, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
    >
      <Text style={[styles.buttonText, primary && styles.buttonTextPrimary]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.background,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  text: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
  },
  buttonTextPrimary: {
    color: '#fff',
  },
});
