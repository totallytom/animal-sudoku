import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AnimalIcon } from '../components/AnimalIcon';
import { DialogButton } from '../components/Dialog';
import { SoloGame } from '../components/SoloGame';
import { addDays, animalsFor, dailyPuzzle, dateKey, getBiome } from '../lib/biomes';
import { useProgress } from '../lib/progress';
import { DIFFICULTY_LABEL } from '../lib/sudoku';
import { colors } from '../lib/theme';

export default function DailyScreen() {
  const { dailyDoneToday, streak } = useProgress();
  // Pin the date when the screen opens, so finishing just after midnight still counts for the day you started.
  const [daily] = useState(() => dailyPuzzle(dateKey()));
  const [playing, setPlaying] = useState(!dailyDoneToday);
  const biome = getBiome(daily.biome);

  if (!playing) return <DailyDone streak={streak} />;

  return (
    <SoloGame
      title="Daily Puzzle"
      animals={animalsFor(daily.biome)}
      modifiers={{ rules: daily.twists, terrain: biome.terrain }}
      makeGame={() => ({
        puzzle: daily.puzzle,
        source: { mode: 'daily', date: daily.date, biome: daily.biome, size: daily.size, difficulty: daily.difficulty },
        label: `${biome.emoji} ${biome.name} · ${DIFFICULTY_LABEL[daily.difficulty]}${daily.twists.length ? ' · weekend twist!' : ''}`,
      })}
      winActions={() => (
        <>
          <DialogButton label="See you tomorrow!" primary onPress={() => setPlaying(false)} />
          <DialogButton label="Home" onPress={() => router.back()} />
        </>
      )}
    />
  );
}

function useCountdownToMidnight(): string {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const left = Math.max(0, Math.floor((midnight.getTime() - now) / 1000));
  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function DailyDone({ streak }: { streak: number }) {
  const countdown = useCountdownToMidnight();
  const tomorrow = dailyPuzzle(addDays(dateKey(), 1));
  const nextBiome = getBiome(tomorrow.biome);

  return (
    <View style={styles.done}>
      <Stack.Screen options={{ title: 'Daily Puzzle' }} />
      <Text style={styles.flame}>🔥</Text>
      <Text style={styles.streak}>{streak}-day streak</Text>
      <Text style={styles.doneText}>Today&apos;s puzzle is done. Nice work!</Text>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Next puzzle in</Text>
        <Text style={styles.countdown}>{countdown}</Text>
        <Text style={styles.cardLabel}>
          Tomorrow: {nextBiome.emoji} {nextBiome.name} · {DIFFICULTY_LABEL[tomorrow.difficulty]}
        </Text>
        <View style={styles.preview}>
          {animalsFor(tomorrow.biome)
            .slice(0, 5)
            .map((a) => (
              <AnimalIcon key={a.id} animal={a} size={28} />
            ))}
        </View>
      </View>
      <Text style={styles.tip}>Come back every day to grow your streak. Streak days add bonus coins (up to 7 days).</Text>
      <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.home, pressed && { opacity: 0.7 }]}>
        <Text style={styles.homeText}>Home</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  done: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
  },
  flame: {
    fontSize: 64,
  },
  streak: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.text,
  },
  doneText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    gap: 6,
    padding: 18,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.thinBorder,
    marginTop: 10,
  },
  cardLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  countdown: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  preview: {
    flexDirection: 'row',
    gap: 4,
  },
  tip: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 340,
  },
  home: {
    marginTop: 10,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  homeText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
});
