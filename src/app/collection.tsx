import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AnimalIcon } from '../components/AnimalIcon';
import { Segmented } from '../components/Segmented';
import { ACHIEVEMENTS } from '../lib/achievements';
import { animalsFor, BIOMES } from '../lib/biomes';
import { useProgress } from '../lib/progress';
import { stickerId } from '../lib/progressState';
import { colors } from '../lib/theme';

type Tab = 'stickers' | 'badges';

export default function CollectionScreen() {
  const [tab, setTab] = useState<Tab>('stickers');
  const { progress } = useProgress();
  const earnedBadges = ACHIEVEMENTS.filter((a) => progress.achievements[a.id]).length;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Segmented
        options={[
          { value: 'stickers', label: `Stickers ${progress.stickers.length}/${BIOMES.length * 9}` },
          { value: 'badges', label: `Badges ${earnedBadges}/${ACHIEVEMENTS.length}` },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'stickers'
        ? BIOMES.map((biome) => {
            const animals = animalsFor(biome.id);
            const owned = animals.filter((a) => progress.stickers.includes(stickerId(biome.id, a))).length;
            return (
              <View key={biome.id} style={[styles.page, { backgroundColor: biome.ground, borderColor: biome.color }]}>
                <View style={styles.pageHeader}>
                  <Text style={styles.pageTitle}>
                    {biome.emoji} {biome.name}
                  </Text>
                  <Text style={styles.pageCount}>
                    {owned}/{animals.length}
                    {owned === animals.length ? ' ✓' : ''}
                  </Text>
                </View>
                <View style={styles.stickerGrid}>
                  {animals.map((a) => {
                    const has = progress.stickers.includes(stickerId(biome.id, a));
                    return (
                      <View key={a.id} style={[styles.sticker, has ? styles.stickerOwned : styles.stickerMissing]}>
                        <AnimalIcon animal={a} size={44} silhouette={!has} />
                        <Text style={[styles.stickerName, !has && { opacity: 0.5 }]} numberOfLines={1}>
                          {has ? a.name : '???'}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })
        : ACHIEVEMENTS.map((a) => {
            const earned = progress.achievements[a.id];
            const { current, target } = a.progress(progress);
            return (
              <View key={a.id} style={[styles.badgeRow, earned ? styles.badgeEarned : null]}>
                <View style={[styles.badgeCircle, !earned && styles.badgeLocked]}>
                  <Text style={[styles.badgeIcon, !earned && { opacity: 0.35 }]}>{a.badge}</Text>
                </View>
                <View style={styles.badgeText}>
                  <Text style={styles.badgeName}>
                    {a.name}
                    {earned ? ' ✓' : ''}
                  </Text>
                  <Text style={styles.badgeDesc}>{a.description}</Text>
                  {!earned && target > 1 ? (
                    <View style={styles.track}>
                      <View style={[styles.fill, { width: `${(current / target) * 100}%` }]} />
                    </View>
                  ) : null}
                </View>
                <Text style={styles.badgeReward}>{earned ? `Earned ${earned}` : `${current}/${target} · ${a.coins} 🪙`}</Text>
              </View>
            );
          })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 12,
  },
  page: {
    borderRadius: 20,
    borderWidth: 2,
    padding: 12,
    gap: 10,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  pageCount: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textMuted,
  },
  stickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  sticker: {
    width: 90,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 16,
    gap: 2,
  },
  stickerOwned: {
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  stickerMissing: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(59,47,42,0.25)',
  },
  stickerName: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.thinBorder,
  },
  badgeEarned: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  badgeCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1D6',
  },
  badgeLocked: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.thinBorder,
  },
  badgeIcon: {
    fontSize: 28,
  },
  badgeText: {
    flex: 1,
    gap: 2,
  },
  badgeName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  badgeDesc: {
    fontSize: 12,
    color: colors.textMuted,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.background,
    overflow: 'hidden',
    marginTop: 4,
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  badgeReward: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    maxWidth: 90,
    textAlign: 'right',
  },
});
