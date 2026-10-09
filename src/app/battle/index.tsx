import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { PlayerSymbol } from '../../components/PlayerChip';
import { Segmented } from '../../components/Segmented';
import { MAX_PLAYERS, MIN_PLAYERS } from '../../lib/players';
import { useSettings } from '../../lib/settings';
import type { BoardSize, Difficulty } from '../../lib/sudoku';
import { colors } from '../../lib/theme';

type Mode = 'race' | 'shared';

const MODES: { value: Mode; title: string; icon: string; description: string }[] = [
  {
    value: 'race',
    title: 'Race',
    icon: '⏱',
    description: 'Everyone solves the same puzzle, one at a time. Fastest wins. Each mistake adds 10 seconds.',
  },
  {
    value: 'shared',
    title: 'Shared board',
    icon: '🤝',
    description: 'Take turns placing one animal each on the same board. +1 for a correct animal, −1 for a wrong one.',
  },
];

const SIZES: { value: BoardSize; label: string }[] = [
  { value: 4, label: '4×4' },
  { value: 6, label: '6×6' },
  { value: 9, label: '9×9' },
];

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

const COUNTS = Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, k) => ({
  value: MIN_PLAYERS + k,
  label: `${MIN_PLAYERS + k} players`,
}));

export default function BattleSetupScreen() {
  const { settings } = useSettings();
  const [mode, setMode] = useState<Mode>('race');
  const [size, setSize] = useState<BoardSize>(4);
  const [difficulty, setDifficulty] = useState<Difficulty>(settings.difficulty);
  const [names, setNames] = useState<string[]>(() => Array.from({ length: MAX_PLAYERS }, (_, i) => `Player ${i + 1}`));
  const [count, setCount] = useState(2);

  const start = () => {
    const players = names.slice(0, count).map((n, i) => n.trim() || `Player ${i + 1}`);
    router.push({
      pathname: mode === 'race' ? '/battle/race' : '/battle/shared',
      params: { size: String(size), difficulty, players: JSON.stringify(players) },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.intro}>Pass-the-phone battles: everyone plays on this one phone, no internet needed.</Text>

      <Text style={styles.section}>Mode</Text>
      {MODES.map((m) => {
        const active = mode === m.value;
        return (
          <Pressable
            key={m.value}
            onPress={() => setMode(m.value)}
            style={[styles.modeCard, active && styles.modeCardActive]}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
          >
            <View style={[styles.radio, active && styles.radioActive]}>{active ? <View style={styles.radioDot} /> : null}</View>
            <View style={styles.modeText}>
              <Text style={styles.modeTitle}>
                {m.icon} {m.title}
              </Text>
              <Text style={styles.modeDescription}>{m.description}</Text>
            </View>
          </Pressable>
        );
      })}

      <Text style={styles.section}>Board</Text>
      <Segmented options={SIZES} value={size} onChange={setSize} />
      <Segmented options={DIFFICULTIES} value={difficulty} onChange={setDifficulty} />

      <Text style={styles.section}>Players</Text>
      <Segmented options={COUNTS} value={count} onChange={setCount} />
      {names.slice(0, count).map((name, i) => (
        <View key={i} style={styles.playerRow}>
          <PlayerSymbol index={i} size={34} />
          <TextInput
            value={name}
            onChangeText={(text) => setNames((prev) => prev.map((n, k) => (k === i ? text : n)))}
            placeholder={`Player ${i + 1}`}
            placeholderTextColor={colors.textMuted}
            maxLength={14}
            selectTextOnFocus
            style={styles.input}
            accessibilityLabel={`Player ${i + 1} name`}
          />
        </View>
      ))}

      <Pressable
        onPress={start}
        style={({ pressed }) => [styles.start, pressed && { transform: [{ scale: 0.97 }] }]}
        accessibilityRole="button"
      >
        <Text style={styles.startText}>Start battle</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 10,
  },
  intro: {
    fontSize: 15,
    color: colors.textMuted,
  },
  section: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 14,
  },
  modeCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.thinBorder,
    backgroundColor: colors.surface,
  },
  modeCardActive: {
    borderColor: colors.text,
    borderWidth: 3,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioActive: {
    borderColor: colors.text,
  },
  radioDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.text,
  },
  modeText: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  modeDescription: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.thinBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  start: {
    marginTop: 20,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
});
