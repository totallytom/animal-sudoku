import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { getBiome, levelRules, levelsInBiome } from '../../lib/biomes';
import { RULES } from '../../lib/rules';
import { useProgress } from '../../lib/progress';
import { DIFFICULTY_LABEL } from '../../lib/sudoku';
import { colors } from '../../lib/theme';

export default function BiomeLevelsScreen() {
  const { biome: biomeParam } = useLocalSearchParams<{ biome: string }>();
  const biome = getBiome(biomeParam);
  const { progress, isLevelUnlocked } = useProgress();
  const { width } = useWindowDimensions();
  const tile = Math.min(110, (Math.min(width, 500) - 32 - 2 * 12) / 3);

  return (
    <>
      <Stack.Screen options={{ title: `${biome.emoji} ${biome.name}` }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.tagline}>{biome.tagline}</Text>
        <View style={styles.grid}>
          {levelsInBiome(biome.id).map((level) => {
            const unlocked = isLevelUnlocked(level);
            const stars = progress.levelStars[level.id] ?? 0;
            const rules = levelRules(level);
            return (
              <Pressable
                key={level.id}
                disabled={!unlocked}
                onPress={() => router.push({ pathname: '/level/[id]', params: { id: level.id } })}
                style={({ pressed }) => [
                  styles.tile,
                  { width: tile, height: tile * 1.15 },
                  level.boss && styles.bossTile,
                  unlocked ? { backgroundColor: colors.surface, borderColor: biome.color } : styles.tileLocked,
                  pressed && { transform: [{ scale: 0.95 }] },
                ]}
                accessibilityRole="button"
                accessibilityState={{ disabled: !unlocked }}
                accessibilityLabel={
                  unlocked
                    ? `Level ${level.number}, ${level.size} by ${level.size}, ${DIFFICULTY_LABEL[level.difficulty]}, ${
                        rules.map((r) => RULES[r].name).join(', ') || 'classic rules'
                      }, ${stars} stars`
                    : `Level ${level.number}, locked`
                }
              >
                <Text style={styles.number}>{unlocked ? (level.boss ? '👑' : level.number) : '🔒'}</Text>
                <Text style={styles.meta}>
                  {level.size}×{level.size}
                </Text>
                <Text style={styles.meta}>{DIFFICULTY_LABEL[level.difficulty]}</Text>
                {rules.length ? <Text style={styles.ruleIcons}>{rules.filter((r) => r !== 'boss').map((r) => RULES[r].emoji).join('')}</Text> : null}
                <Text style={styles.stars}>{[0, 1, 2].map((i) => (i < stars ? '⭐' : '☆')).join('')}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.twist}>
          <Text style={styles.twistTitle}>
            {RULES[biome.twist].emoji} This world&apos;s twist: {RULES[biome.twist].name}
          </Text>
          <Text style={styles.hint}>{RULES[biome.twist].summary}</Text>
        </View>
        <Text style={styles.hint}>Clear a level to unlock the next one. Every first clear earns a sticker!</Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: 16,
    gap: 14,
    alignItems: 'center',
  },
  tagline: {
    fontSize: 15,
    color: colors.text,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    maxWidth: 500,
  },
  tile: {
    borderRadius: 18,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  bossTile: {
    borderWidth: 4,
    borderStyle: 'dashed',
  },
  ruleIcons: {
    fontSize: 12,
  },
  twist: {
    alignItems: 'center',
    gap: 2,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.6)',
    maxWidth: 500,
  },
  twistTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  tileLocked: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderColor: 'rgba(59,47,42,0.15)',
    borderStyle: 'dashed',
  },
  number: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
  },
  meta: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  stars: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
