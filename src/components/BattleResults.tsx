import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Achievement } from '../lib/achievements';
import { colors } from '../lib/theme';
import { Dialog, DialogTitle } from './Dialog';
import { PlayerChip } from './PlayerChip';

export interface Standing {
  player: number;
  name: string;
  detail: string;
  /** 1-based; tied players share a rank. */
  rank: number;
}

const MEDALS = ['🥇', '🥈', '🥉'];

interface Props {
  visible: boolean;
  standings: Standing[];
  /** Badges unlocked by finishing this battle. */
  badges?: Achievement[];
  children: ReactNode;
}

export function BattleResults({ visible, standings, badges = [], children }: Props) {
  const winners = standings.filter((s) => s.rank === 1);
  const title = winners.length > 1 ? "It's a tie!" : `${winners[0]?.name ?? ''} wins!`;

  return (
    <Dialog visible={visible}>
      <Text style={styles.trophy}>🏆</Text>
      <DialogTitle>{title}</DialogTitle>
      <View style={styles.list}>
        {standings.map((s) => (
          <View key={s.player} style={styles.row}>
            <Text style={styles.rank}>{MEDALS[s.rank - 1] ?? `${s.rank}.`}</Text>
            <View style={styles.chip}>
              <PlayerChip index={s.player} name={s.name} detail={s.detail} active={s.rank === 1} />
            </View>
          </View>
        ))}
      </View>
      {badges.map((b) => (
        <Text key={b.id} style={styles.badge}>
          {b.badge} Badge unlocked: {b.name} (+{b.coins} 🪙)
        </Text>
      ))}
      {children}
    </Dialog>
  );
}

/** Ranks players by score (lower is better when `lowerWins`). Ties share a rank. */
export function rankPlayers(scores: number[], lowerWins: boolean): number[] {
  return scores.map((score) => 1 + scores.filter((other) => (lowerWins ? other < score : other > score)).length);
}

const styles = StyleSheet.create({
  badge: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  trophy: {
    fontSize: 44,
  },
  list: {
    width: '100%',
    gap: 8,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rank: {
    width: 30,
    fontSize: 22,
    textAlign: 'center',
    color: colors.text,
    fontWeight: '700',
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
  },
});
