import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AnimalIcon } from '../../components/AnimalIcon';
import { CurrencyBar } from '../../components/CurrencyBar';
import { animalsFor, BIOMES, levelsInBiome } from '../../lib/biomes';
import { useProgress } from '../../lib/progress';
import { colors } from '../../lib/theme';

export default function AdventureScreen() {
  const { progress, stars, isBiomeUnlocked } = useProgress();

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <CurrencyBar />
      {BIOMES.map((biome) => {
        const unlocked = isBiomeUnlocked(biome.id);
        const levels = levelsInBiome(biome.id);
        const earned = levels.reduce((sum, l) => sum + (progress.levelStars[l.id] ?? 0), 0);
        const cleared = levels.filter((l) => progress.levelStars[l.id]).length;
        return (
          <Pressable
            key={biome.id}
            onPress={() => unlocked && router.push({ pathname: '/adventure/[biome]', params: { biome: biome.id } })}
            disabled={!unlocked}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: unlocked ? biome.color : colors.surface },
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
            accessibilityRole="button"
            accessibilityState={{ disabled: !unlocked }}
            accessibilityLabel={
              unlocked
                ? `${biome.name}, ${cleared} of ${levels.length} levels cleared, ${earned} stars`
                : `${biome.name}, locked, needs ${biome.starsToUnlock} stars`
            }
          >
            <View style={styles.header}>
              <Text style={styles.emoji}>{unlocked ? biome.emoji : '🔒'}</Text>
              <View style={styles.headerText}>
                <Text style={styles.name}>{biome.name}</Text>
                <Text style={styles.tagline}>{biome.tagline}</Text>
              </View>
            </View>
            <View style={styles.animals}>
              {animalsFor(biome.id).map((a) => (
                <AnimalIcon key={a.id} animal={a} size={28} silhouette={!unlocked} />
              ))}
            </View>
            {unlocked ? (
              <View style={styles.progressRow}>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${(cleared / levels.length) * 100}%` }]} />
                </View>
                <Text style={styles.progressText}>
                  {cleared}/{levels.length} · ⭐ {earned}/{levels.length * 3}
                </Text>
              </View>
            ) : (
              <Text style={styles.locked}>
                Earn {biome.starsToUnlock - stars} more ⭐ to unlock ({stars}/{biome.starsToUnlock})
              </Text>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 14,
  },
  card: {
    borderRadius: 22,
    padding: 16,
    gap: 12,
    borderWidth: 2,
    borderColor: 'rgba(59,47,42,0.12)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emoji: {
    fontSize: 38,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
  },
  tagline: {
    fontSize: 13,
    color: colors.text,
    opacity: 0.75,
  },
  animals: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 14,
    padding: 6,
    justifyContent: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  track: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.6)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.text,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  locked: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
    textAlign: 'center',
  },
});
