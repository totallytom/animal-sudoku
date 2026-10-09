import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BattleResults, rankPlayers, type Standing } from '../../components/BattleResults';
import { Dialog, DialogButton, DialogText, DialogTitle } from '../../components/Dialog';
import { PlayArea } from '../../components/PlayArea';
import { PlayerSymbol } from '../../components/PlayerChip';
import { QuitGuard } from '../../components/QuitGuard';
import type { Achievement } from '../../lib/achievements';
import { PLAYER_STYLES, parsePlayers } from '../../lib/players';
import { useProgress } from '../../lib/progress';
import { useSettings } from '../../lib/settings';
import { DIFFICULTY_LABEL, generatePuzzle, parseDifficulty, parseSize, type Puzzle } from '../../lib/sudoku';
import { colors } from '../../lib/theme';
import { formatTime, useSudokuGame } from '../../lib/useSudokuGame';

const MISTAKE_PENALTY = 10; // seconds added per mistake

interface RaceResult {
  seconds: number;
  mistakes: number;
  finished: boolean;
}

type Phase = { kind: 'handoff'; player: number } | { kind: 'playing'; player: number } | { kind: 'results' };

export default function RaceScreen() {
  const params = useLocalSearchParams<{ size: string; difficulty: string; players: string }>();
  const size = parseSize(params.size);
  const difficulty = parseDifficulty(params.difficulty);
  const [players] = useState(() => parsePlayers(params.players));
  const { settings } = useSettings();
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const boardWidth = Math.min(screenWidth - 24, 460);

  const [puzzle, setPuzzle] = useState<Puzzle>(() => generatePuzzle(size, difficulty));
  const [phase, setPhase] = useState<Phase>({ kind: 'handoff', player: 0 });
  const [results, setResults] = useState<RaceResult[]>([]);
  const [confirmGiveUp, setConfirmGiveUp] = useState(false);
  const [badges, setBadges] = useState<Achievement[]>([]);
  const { recordBattle } = useProgress();

  const finishTurn = (result: RaceResult) => {
    const next = [...results, result];
    setResults(next);
    if (next.length < players.length) {
      setPhase({ kind: 'handoff', player: next.length });
    } else {
      setPhase({ kind: 'results' });
      setBadges(recordBattle());
    }
  };

  const state = useSudokuGame(() => puzzle, {
    mistakeLimit: 0,
    showMistakes: true, // racers always see mistakes, since each one costs time
    paused: phase.kind !== 'playing',
    onWin: ({ seconds, mistakes }) => finishTurn({ seconds, mistakes, finished: true }),
  });

  const beginTurn = (player: number) => {
    state.load(puzzle); // same puzzle for everyone, fresh board and timer
    setPhase({ kind: 'playing', player });
  };

  const giveUp = () => {
    setConfirmGiveUp(false);
    finishTurn({ seconds: state.seconds, mistakes: state.mistakes, finished: false });
  };

  const rematch = () => {
    setPuzzle(generatePuzzle(size, difficulty));
    setResults([]);
    setBadges([]);
    setPhase({ kind: 'handoff', player: 0 });
  };

  const total = (r: RaceResult) => r.seconds + r.mistakes * MISTAKE_PENALTY;
  // Players who gave up rank below everyone who finished.
  const ranks = rankPlayers(
    results.map((r) => (r.finished ? total(r) : Number.MAX_SAFE_INTEGER)),
    true,
  );
  const standings: Standing[] = results
    .map((r, i) => ({
      player: i,
      name: players[i],
      rank: ranks[i],
      detail: r.finished
        ? `${formatTime(total(r))} total · ${formatTime(r.seconds)} + ${r.mistakes} mistake${r.mistakes === 1 ? '' : 's'}`
        : 'Gave up',
    }))
    .sort((a, b) => a.rank - b.rank);

  return (
    <>
      <QuitGuard active={phase.kind !== 'results'} />

      {phase.kind === 'handoff' ? (
        <View style={[styles.handoff, { paddingBottom: insets.bottom + 24 }]}>
          <Text style={styles.handoffStep}>
            Player {phase.player + 1} of {players.length}
          </Text>
          <PlayerSymbol index={phase.player} size={88} />
          <Text style={styles.handoffTitle}>Pass the phone to</Text>
          <Text style={[styles.handoffName, { color: PLAYER_STYLES[phase.player].color }]}>{players[phase.player]}</Text>
          <Text style={styles.handoffInfo}>
            {size}×{size} · {DIFFICULTY_LABEL[difficulty]} · same puzzle for everyone{'\n'}
            Each mistake adds {MISTAKE_PENALTY} seconds. No hints!
          </Text>
          <Pressable
            onPress={() => beginTurn(phase.player)}
            style={({ pressed }) => [styles.readyButton, pressed && { transform: [{ scale: 0.97 }] }]}
            accessibilityRole="button"
          >
            <Text style={styles.readyText}>I&apos;m ready, start the clock!</Text>
          </Pressable>
        </View>
      ) : phase.kind === 'playing' ? (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
          <View style={[styles.statusBar, { width: boardWidth }]}>
            <View style={styles.who}>
              <PlayerSymbol index={phase.player} size={26} />
              <Text style={styles.whoName} numberOfLines={1}>
                {players[phase.player]}
              </Text>
            </View>
            <Text style={styles.status}>
              ✕ {state.mistakes} (+{state.mistakes * MISTAKE_PENALTY}s)
            </Text>
            <Text style={styles.timer}>⏱ {formatTime(state.seconds)}</Text>
          </View>

          <PlayArea state={state} settings={settings} width={boardWidth} allowHints={false} />

          <Pressable onPress={() => setConfirmGiveUp(true)} style={({ pressed }) => [styles.giveUp, pressed && { opacity: 0.6 }]}>
            <Text style={styles.giveUpText}>Give up</Text>
          </Pressable>
        </ScrollView>
      ) : null}

      <Dialog visible={confirmGiveUp}>
        <DialogTitle>Give up?</DialogTitle>
        <DialogText>{players[phase.kind === 'playing' ? phase.player : 0]} will be ranked last.</DialogText>
        <DialogButton label="Keep going" primary onPress={() => setConfirmGiveUp(false)} />
        <DialogButton label="Give up" onPress={giveUp} />
      </Dialog>

      <BattleResults visible={phase.kind === 'results'} standings={standings} badges={badges}>
        <DialogButton label="Rematch (new puzzle)" primary onPress={rematch} />
        <DialogButton label="Change setup" onPress={() => router.back()} />
        <DialogButton label="Home" onPress={() => router.dismissAll()} />
      </BattleResults>
    </>
  );
}

const styles = StyleSheet.create({
  handoff: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  handoffStep: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  handoffTitle: {
    fontSize: 20,
    color: colors.text,
    marginTop: 8,
  },
  handoffName: {
    fontSize: 38,
    fontWeight: '900',
    textAlign: 'center',
  },
  handoffInfo: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 21,
  },
  readyButton: {
    marginTop: 16,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 28,
  },
  readyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  content: {
    alignItems: 'center',
    paddingTop: 8,
    gap: 14,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  who: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  whoName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    flexShrink: 1,
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  timer: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  giveUp: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  giveUpText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
