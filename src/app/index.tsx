import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimalIcon } from '../components/AnimalIcon';
import { CurrencyBar } from '../components/CurrencyBar';
import { getBiome, LEVELS } from '../lib/biomes';
import { useProgress } from '../lib/progress';
import { useSettings } from '../lib/settings';
import { DIFFICULTY_LABEL, type BoardSize } from '../lib/sudoku';
import { colors } from '../lib/theme';

interface Mode {
  size: BoardSize;
  title: string;
  subtitle: string;
  color: string;
}

const MODES: Mode[] = [
  { size: 4, title: '4×4', subtitle: 'Mini', color: colors.mini },
  { size: 6, title: '6×6', subtitle: 'Sudoku', color: colors.six },
  { size: 9, title: '9×9', subtitle: 'Classic', color: colors.nine },
];

export default function HomeScreen() {
  const { settings } = useSettings();
  const { progress, streak, dailyDoneToday, isLevelUnlocked } = useProgress();

  // The first unlocked level that hasn't been cleared yet.
  const nextLevel = LEVELS.find((l) => isLevelUnlocked(l) && !progress.levelStars[l.id]);
  const nextBiome = nextLevel ? getBiome(nextLevel.biome) : null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.parade}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((v) => (
              <AnimalIcon key={v} value={v} size={26} />
            ))}
          </View>
          <Text style={styles.title}>Animal Sudoku</Text>
          <CurrencyBar />
        </View>

        {/* Adventure */}
        <Pressable
          onPress={() => router.push('/adventure')}
          style={({ pressed }) => [styles.hero, { backgroundColor: nextBiome?.color ?? colors.mini }, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Text style={styles.heroEmoji}>🗺️</Text>
          <View style={styles.flex}>
            <Text style={styles.heroTitle}>Adventure</Text>
            <Text style={styles.heroSubtitle}>
              {nextLevel && nextBiome
                ? `Next up: ${nextBiome.emoji} ${nextBiome.name} level ${nextLevel.number}`
                : 'Explore savanna, ocean, arctic and jungle'}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        {/* Daily puzzle */}
        <Pressable
          onPress={() => router.push('/daily')}
          style={({ pressed }) => [styles.daily, dailyDoneToday && styles.dailyDone, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Text style={styles.heroEmoji}>{dailyDoneToday ? '✅' : '📅'}</Text>
          <View style={styles.flex}>
            <Text style={styles.dailyTitle}>Daily Puzzle</Text>
            <Text style={styles.dailySubtitle}>
              {dailyDoneToday ? 'Done for today. Come back tomorrow!' : streak > 0 ? `Keep your ${streak}-day streak going!` : 'A new puzzle every day'}
            </Text>
          </View>
          <View style={styles.streak}>
            <Text style={styles.streakFlame}>🔥</Text>
            <Text style={styles.streakNumber}>{streak}</Text>
          </View>
        </Pressable>

        {/* Quick play */}
        <Text style={styles.section}>Quick play · {DIFFICULTY_LABEL[settings.difficulty]}</Text>
        <View style={styles.quickRow}>
          {MODES.map((mode) => (
            <Pressable
              key={mode.size}
              onPress={() => router.push({ pathname: '/game/[size]', params: { size: String(mode.size) } })}
              style={({ pressed }) => [styles.quick, { backgroundColor: mode.color }, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`Quick play ${mode.size} by ${mode.size} ${mode.subtitle}`}
            >
              <Text style={styles.quickTitle}>{mode.title}</Text>
              <Text style={styles.quickSubtitle}>{mode.subtitle}</Text>
            </Pressable>
          ))}
        </View>

        {/* More */}
        <View style={styles.tiles}>
          <Tile icon="🏞️" label="Sanctuary" href="/sanctuary" />
          <Tile icon="📒" label="Collection" href="/collection" />
          <Tile icon="⚔️" label="Battle" href="/battle" />
        </View>

        <Pressable
          onPress={() => router.push('/settings')}
          style={({ pressed }) => [styles.settingsButton, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
        >
          <Text style={styles.settingsText}>⚙️  Settings</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Tile({ icon, label, href }: { icon: string; label: string; href: Href }) {
  return (
    <Pressable
      onPress={() => router.push(href)}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <Text style={styles.tileIcon}>{icon}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  parade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 2,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.text,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  flex: {
    flex: 1,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 14,
    borderWidth: 2,
    borderColor: 'rgba(59,47,42,0.12)',
  },
  heroEmoji: {
    fontSize: 34,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
  },
  heroSubtitle: {
    fontSize: 13,
    color: colors.text,
    opacity: 0.8,
    marginTop: 2,
  },
  chevron: {
    fontSize: 32,
    color: colors.text,
    opacity: 0.5,
  },
  daily: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 14,
    backgroundColor: colors.text,
  },
  dailyDone: {
    backgroundColor: '#5E514A',
  },
  dailyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  dailySubtitle: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.85,
    marginTop: 2,
  },
  streak: {
    alignItems: 'center',
  },
  streakFlame: {
    fontSize: 22,
  },
  streakNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
  },
  section: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quick: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(59,47,42,0.12)',
  },
  quickTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
  },
  quickSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    opacity: 0.75,
  },
  tiles: {
    flexDirection: 'row',
    gap: 10,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.thinBorder,
    gap: 4,
  },
  tileIcon: {
    fontSize: 28,
  },
  tileLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  settingsButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.surface,
  },
  settingsText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
});
