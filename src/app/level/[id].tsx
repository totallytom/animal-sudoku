import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { DialogButton } from '../../components/Dialog';
import { SoloGame } from '../../components/SoloGame';
import { animalsFor, getBiome, getLevel, levelPuzzle, levelRules, nextLevel } from '../../lib/biomes';
import { useProgress } from '../../lib/progress';
import { DIFFICULTY_LABEL } from '../../lib/sudoku';
import { colors } from '../../lib/theme';

export default function LevelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const level = getLevel(id);
  const { isLevelUnlocked } = useProgress();

  if (!level || !isLevelUnlocked(level)) {
    return (
      <View style={styles.locked}>
        <Stack.Screen options={{ title: 'Locked' }} />
        <Text style={styles.lockedEmoji}>🔒</Text>
        <Text style={styles.lockedText}>This level isn&apos;t unlocked yet.</Text>
      </View>
    );
  }

  const biome = getBiome(level.biome);
  const next = nextLevel(level);

  return (
    <SoloGame
      // Remount when moving to the next level so all game state starts fresh.
      key={level.id}
      title={level.boss ? `👑 ${biome.name} Boss` : `${biome.emoji} Level ${level.number}`}
      animals={animalsFor(level.biome)}
      modifiers={{
        rules: levelRules(level),
        night: level.night,
        runaway: level.runaway,
        timeLimit: level.boss?.timeLimit,
        terrain: biome.terrain,
      }}
      makeGame={() => ({
        puzzle: levelPuzzle(level),
        source: { mode: 'level', level },
        label: `${biome.name} · ${level.size}×${level.size} · ${DIFFICULTY_LABEL[level.difficulty]}`,
      })}
      winActions={({ replay }) => (
        <>
          {next ? (
            <DialogButton
              label={`Next: Level ${next.number}`}
              primary
              onPress={() => router.replace({ pathname: '/level/[id]', params: { id: next.id } })}
            />
          ) : null}
          <DialogButton label="Replay for more stars" primary={!next} onPress={replay} />
          <DialogButton label={`${biome.name} levels`} onPress={() => router.back()} />
        </>
      )}
    />
  );
}

const styles = StyleSheet.create({
  locked: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  lockedEmoji: {
    fontSize: 48,
  },
  lockedText: {
    fontSize: 16,
    color: colors.textMuted,
  },
});
