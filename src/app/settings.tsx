import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { AnimalIcon } from '../components/AnimalIcon';
import { Segmented } from '../components/Segmented';
import { useSettings, type MistakeLimit, type Settings } from '../lib/settings';
import type { Difficulty } from '../lib/sudoku';
import { colors } from '../lib/theme';

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

const LIMITS: { value: MistakeLimit; label: string }[] = [
  { value: 0, label: 'Off' },
  { value: 3, label: '3' },
  { value: 5, label: '5' },
];

type ToggleKey = { [K in keyof Settings]: Settings[K] extends boolean ? K : never }[keyof Settings];

interface Toggle {
  key: ToggleKey;
  label: string;
  description: string;
}

const GAMEPLAY: Toggle[] = [
  { key: 'highlightMatching', label: 'Highlight matching animals', description: 'Ring every copy of the selected animal' },
  { key: 'showTimer', label: 'Show timer', description: 'Display elapsed time while playing' },
  { key: 'sound', label: 'Sound effects', description: 'Animal calls when placed, plus celebration sounds' },
  { key: 'haptics', label: 'Vibration', description: 'Haptic feedback on taps, mistakes and wins' },
];

const APPEARANCE: Toggle[] = [
  {
    key: 'animalFrames',
    label: 'Animal frames',
    description: 'Show each animal on a round token, like a game piece',
  },
];

const ACCESSIBILITY: Toggle[] = [
  {
    key: 'colorblindMode',
    label: 'Colorblind-friendly mode',
    description: 'Removes animal color tints and uses a blue/orange palette. Animals are told apart by shape only.',
  },
  {
    key: 'showNumberBadges',
    label: 'Number badges',
    description: 'Show a small number on each animal as an extra way to tell them apart',
  },
];

export default function SettingsScreen() {
  const { settings, update, reset } = useSettings();

  const renderToggles = (toggles: Toggle[]) => (
    <View style={styles.card}>
      {toggles.map((t, idx) => (
        <View key={t.key} style={[styles.row, idx > 0 && styles.rowDivider]}>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>{t.label}</Text>
            <Text style={styles.rowDescription}>{t.description}</Text>
          </View>
          <Switch
            value={settings[t.key]}
            onValueChange={(v) => update({ [t.key]: v })}
            trackColor={{ true: colors.primary }}
            accessibilityLabel={t.label}
          />
        </View>
      ))}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.section}>Difficulty</Text>
      <Segmented options={DIFFICULTIES} value={settings.difficulty} onChange={(difficulty) => update({ difficulty })} />
      <Text style={styles.hint}>Applies to the next new game.</Text>

      <Text style={styles.section}>Mistakes</Text>
      {renderToggles([{ key: 'showMistakes', label: 'Show mistakes', description: 'Mark wrong animals with a ✕ right away' }])}
      <Text style={styles.subLabel}>Mistake limit</Text>
      <Segmented
        options={LIMITS}
        value={settings.mistakeLimit}
        onChange={(mistakeLimit) => update({ mistakeLimit })}
        disabled={!settings.showMistakes}
      />
      <Text style={styles.hint}>
        {settings.showMistakes
          ? 'The game ends after this many mistakes. Choose Off for relaxed play.'
          : 'Turn on "Show mistakes" to use a mistake limit.'}
      </Text>

      <Text style={styles.section}>Gameplay</Text>
      {renderToggles(GAMEPLAY)}

      <Text style={styles.section}>Appearance</Text>
      {renderToggles(APPEARANCE)}

      <Text style={styles.section}>Accessibility</Text>
      {renderToggles(ACCESSIBILITY)}
      <View style={styles.preview}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((v) => (
          <AnimalIcon key={v} value={v} size={30} badge={settings.showNumberBadges} />
        ))}
      </View>

      <Pressable onPress={reset} style={({ pressed }) => [styles.reset, pressed && { opacity: 0.6 }]}>
        <Text style={styles.resetText}>Reset to defaults</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 10,
  },
  section: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 14,
  },
  subLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginTop: 4,
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.thinBorder,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.thinBorder,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  rowDescription: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  preview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  reset: {
    alignSelf: 'center',
    marginTop: 20,
    padding: 12,
  },
  resetText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
