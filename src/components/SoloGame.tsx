import { router, Stack } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimalSetContext, type Animal } from '../lib/animals';
import type { TerrainKind } from '../lib/biomes';
import { useReducedMotion } from '../lib/motion';
import { useProgress } from '../lib/progress';
import type { Reward, WinSource } from '../lib/progressState';
import { RULES, type RuleId } from '../lib/rules';
import { useSettings } from '../lib/settings';
import type { Puzzle } from '../lib/sudoku';
import { boardPalette, colors } from '../lib/theme';
import { formatTime, useSudokuGame } from '../lib/useSudokuGame';
import { Dialog, DialogButton, DialogText, DialogTitle } from './Dialog';
import { PlayArea } from './PlayArea';
import { RewardSummary } from './RewardSummary';
import { RuleBar } from './RuleBar';

export interface GameSetup {
  puzzle: Puzzle;
  source: WinSource;
  /** Shown above the board, e.g. "Savanna · Level 3 · Easy". */
  label: string;
}

export interface WinControls {
  replay: () => void;
  newGame: () => void;
}

/** Special rules and pressure modifiers for this game. */
export interface GameModifiers {
  rules: RuleId[];
  night?: boolean;
  runaway?: boolean;
  /** Boss time limit in seconds. */
  timeLimit?: number;
  /** Terrain kinds (names and icons) for habitat levels. */
  terrain?: TerrainKind[];
}

interface Props {
  title: string;
  animals: Animal[];
  modifiers?: GameModifiers;
  makeGame: () => GameSetup;
  /** Quick play shows a "New game" button under the board. */
  allowNewGame?: boolean;
  winActions: (controls: WinControls) => ReactNode;
}

/** Single-player game screen shared by quick play, adventure levels and the daily puzzle. */
export function SoloGame(props: Props) {
  // The animal set must wrap the game so sounds and icons use the right animals.
  return (
    <AnimalSetContext.Provider value={props.animals}>
      <SoloGameInner {...props} />
    </AnimalSetContext.Provider>
  );
}

const NO_MODIFIERS: GameModifiers = { rules: [] };

function SoloGameInner({ title, makeGame, allowNewGame, winActions, modifiers = NO_MODIFIERS }: Props) {
  const { settings } = useSettings();
  const { progress, recordWin, markRulesSeen } = useProgress();
  const reducedMotion = useReducedMotion();
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const boardWidth = Math.min(screenWidth - 24, 460);
  const palette = boardPalette(settings.colorblindMode);
  // A limit only makes sense if the player can see which animals are wrong.
  const mistakeLimit = settings.showMistakes ? settings.mistakeLimit : 0;

  const [setup, setSetup] = useState<GameSetup>(makeGame);
  const [reward, setReward] = useState<Reward | null>(null);
  const [showWin, setShowWin] = useState(false);
  // Explain new rules before play starts (bosses always get their briefing). The clock waits.
  const [briefing, setBriefing] = useState<RuleId[]>(() =>
    modifiers.rules.filter((id) => id === 'boss' || !progress.seenRules.includes(id)),
  );
  const [showHelp, setShowHelp] = useState(false);
  const rulesOpen = briefing.length > 0 || showHelp;

  const state = useSudokuGame(() => setup.puzzle, {
    mistakeLimit,
    showMistakes: settings.showMistakes,
    paused: rulesOpen,
    timeLimit: modifiers.timeLimit,
    runaway: modifiers.runaway,
    onWin: (stats) => setReward(recordWin(setup.source, stats)),
  });
  const { mistakes, seconds, status } = state;
  const terrainIcons = Object.fromEntries((modifiers.terrain ?? []).map((t) => [t.kind, t.emoji]));

  const closeBriefing = () => {
    markRulesSeen(briefing);
    setBriefing([]);
  };

  // Let the board celebration play before the results pop up.
  useEffect(() => {
    if (status !== 'won') return;
    const id = setTimeout(() => setShowWin(true), reducedMotion ? 300 : 1300);
    return () => clearTimeout(id);
  }, [status, reducedMotion]);

  const reset = (next: GameSetup) => {
    setSetup(next);
    setReward(null);
    setShowWin(false);
    state.load(next.puzzle);
  };
  const controls: WinControls = { replay: () => reset(setup), newGame: () => reset(makeGame()) };

  return (
    <>
      <Stack.Screen options={{ title }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
        <View style={[styles.statusBar, { width: boardWidth }]}>
          <Text style={styles.status} numberOfLines={1}>
            {setup.label}
          </Text>
          {settings.showMistakes ? (
            <Text style={[styles.status, mistakeLimit > 0 && mistakes === mistakeLimit - 1 && { color: palette.error }]}>
              {mistakeLimit ? `✕ ${mistakes}/${mistakeLimit}` : `✕ ${mistakes}`}
            </Text>
          ) : null}
          {settings.showTimer && !modifiers.timeLimit ? <Text style={styles.status}>⏱ {formatTime(seconds)}</Text> : null}
        </View>

        <RuleBar
          rules={modifiers.rules}
          puzzle={state.game}
          terrain={modifiers.terrain ?? []}
          timeLeft={modifiers.timeLimit ? modifiers.timeLimit - seconds : null}
          runaway={state.runaway}
          caught={state.caught}
          width={boardWidth}
          onHelp={() => setShowHelp(true)}
        />

        <PlayArea state={state} settings={settings} width={boardWidth} night={modifiers.night} terrainIcons={terrainIcons} />

        {allowNewGame ? (
          <Pressable onPress={controls.newGame} style={({ pressed }) => [styles.newGame, pressed && { opacity: 0.6 }]}>
            <Text style={styles.newGameText}>New game</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <Dialog visible={rulesOpen}>
        <DialogTitle>{briefing.includes('boss') ? `${RULES.boss.emoji} Boss puzzle!` : showHelp ? 'Level rules' : 'New rule!'}</DialogTitle>
        {(showHelp ? modifiers.rules : briefing).map((id) => (
          <View key={id} style={styles.ruleRow}>
            <Text style={styles.ruleEmoji}>{RULES[id].emoji}</Text>
            <View style={styles.ruleText}>
              <Text style={styles.ruleName}>{RULES[id].name}</Text>
              <Text style={styles.ruleHow}>
                {RULES[id].howTo}
                {id === 'boss' && modifiers.timeLimit ? ` You have ${formatTime(modifiers.timeLimit)}.` : ''}
              </Text>
            </View>
          </View>
        ))}
        <DialogButton
          label={showHelp ? 'Back to the puzzle' : "Let's go!"}
          primary
          onPress={() => (showHelp ? setShowHelp(false) : closeBriefing())}
        />
      </Dialog>

      <Dialog visible={!rulesOpen && ((status === 'won' && showWin) || status === 'lost')}>
        {status === 'won' && reward ? (
          <>
            <DialogTitle>You did it!</DialogTitle>
            <DialogText>
              Time {formatTime(seconds)} · Mistakes {mistakes} · Hints {state.hintsUsed}
            </DialogText>
            <RewardSummary reward={reward} showStars={setup.source.mode !== 'quick'} />
            {winActions(controls)}
          </>
        ) : (
          <>
            <Text style={styles.endEmoji}>{state.lostReason === 'time' ? '⏰' : '🙈'}</Text>
            <DialogTitle>{state.lostReason === 'time' ? "Time's up!" : 'Out of chances'}</DialogTitle>
            <DialogText>
              {state.lostReason === 'time'
                ? 'The boss got away this time. Give it another go!'
                : `${mistakeLimit} mistakes. Give this puzzle another go!`}
            </DialogText>
            <DialogButton label="Try again" primary onPress={controls.replay} />
            {allowNewGame ? <DialogButton label="New puzzle" onPress={controls.newGame} /> : null}
            <DialogButton label="Back" onPress={() => router.back()} />
          </>
        )}
      </Dialog>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingTop: 8,
    gap: 14,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    flexShrink: 1,
  },
  newGame: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  newGameText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  ruleRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  ruleEmoji: {
    fontSize: 28,
    width: 36,
    textAlign: 'center',
  },
  ruleText: {
    flex: 1,
  },
  ruleName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  ruleHow: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  endEmoji: {
    fontSize: 48,
  },
});
