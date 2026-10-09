import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { getBiome } from '../lib/biomes';
import { useFeedback } from '../lib/haptics';
import { useReducedMotion } from '../lib/motion';
import type { Reward } from '../lib/progressState';
import { colors } from '../lib/theme';
import { AnimalIcon } from './AnimalIcon';

/** Stars, coins, sticker, streak and badges earned from a win. */
export function RewardSummary({ reward, showStars }: { reward: Reward; showStars: boolean }) {
  const feedback = useFeedback();
  const reducedMotion = useReducedMotion();
  const [pops] = useState(() => [0, 1, 2].map(() => new Animated.Value(0)));

  useEffect(() => {
    if (reward.coins > 0) feedback.coin();
    if (reducedMotion) {
      pops.forEach((p) => p.setValue(1));
      return;
    }
    Animated.stagger(
      180,
      pops.map((p) => Animated.spring(p, { toValue: 1, friction: 4, tension: 140, useNativeDriver: true })),
    ).start();
    // Run once when the summary appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.wrap}>
      {showStars ? (
        <View style={styles.stars} accessibilityLabel={`${reward.stars} of 3 stars`}>
          {pops.map((p, i) => (
            <Animated.Text
              key={i}
              style={[
                styles.star,
                i >= reward.stars && styles.starEmpty,
                { transform: [{ scale: p }, { rotate: p.interpolate({ inputRange: [0, 1], outputRange: ['-30deg', '0deg'] }) }] },
              ]}
            >
              {i < reward.stars ? '⭐' : '☆'}
            </Animated.Text>
          ))}
        </View>
      ) : null}
      {showStars && reward.previousStars > 0 && reward.stars > reward.previousStars ? (
        <Text style={styles.line}>New best!</Text>
      ) : null}

      {reward.coins > 0 ? <Text style={styles.coins}>+{reward.coins} 🪙</Text> : null}

      {reward.streak ? <Text style={styles.line}>🔥 {reward.streak}-day streak!</Text> : null}

      {reward.sticker ? (
        <View style={styles.sticker}>
          <View style={styles.stickerArt}>
            <AnimalIcon animal={reward.sticker.animal} size={46} />
          </View>
          <View style={styles.stickerText}>
            <Text style={styles.stickerLabel}>New sticker!</Text>
            <Text style={styles.stickerName}>
              {reward.sticker.animal.name} · {getBiome(reward.sticker.biome).name}
            </Text>
          </View>
        </View>
      ) : null}

      {reward.achievements.map((a) => (
        <View key={a.id} style={styles.badge}>
          <Text style={styles.badgeIcon}>{a.badge}</Text>
          <View style={styles.stickerText}>
            <Text style={styles.stickerLabel}>Badge unlocked: {a.name}</Text>
            <Text style={styles.badgeDetail}>
              {a.description} · +{a.coins} 🪙
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  stars: {
    flexDirection: 'row',
    gap: 6,
  },
  star: {
    fontSize: 44,
    color: colors.textMuted,
  },
  starEmpty: {
    opacity: 0.5,
  },
  line: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  coins: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  sticker: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  stickerArt: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  stickerText: {
    flex: 1,
  },
  stickerLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  stickerName: {
    fontSize: 13,
    color: colors.textMuted,
  },
  badge: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.thinBorder,
  },
  badgeIcon: {
    fontSize: 32,
    width: 56,
    textAlign: 'center',
  },
  badgeDetail: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
