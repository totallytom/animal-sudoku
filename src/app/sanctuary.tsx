import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { Achievement } from '../lib/achievements';
import { CurrencyBar } from '../components/CurrencyBar';
import { Dialog, DialogButton, DialogText, DialogTitle } from '../components/Dialog';
import { WanderingAnimal } from '../components/WanderingAnimal';
import { animalsFor, BIOMES, type Biome } from '../lib/biomes';
import { useFeedback } from '../lib/haptics';
import { useProgress } from '../lib/progress';
import { stickerId } from '../lib/progressState';
import { DECORATIONS } from '../lib/sanctuary';
import { useSounds } from '../lib/sounds';
import { colors } from '../lib/theme';

const HABITAT_HEIGHT = 200;
const ANIMAL_SIZE = 40;

export default function SanctuaryScreen() {
  const { progress, buyHabitat, buyDecoration } = useProgress();
  const sounds = useSounds();
  const feedback = useFeedback();
  const { width } = useWindowDimensions();
  const sceneWidth = Math.min(width, 520) - 32;
  const [badges, setBadges] = useState<Achievement[]>([]);

  const purchased = (earned: Achievement[] | null) => {
    if (!earned) return;
    feedback.coin();
    if (earned.length) setBadges(earned);
  };

  const ownedAnimals = (biome: Biome) => animalsFor(biome.id).filter((a) => progress.stickers.includes(stickerId(biome.id, a)));

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <CurrencyBar />
      <Text style={styles.intro}>
        Build habitats with coins. Every animal sticker you collect moves in. Tap an animal to say hello!
      </Text>

      {/* Entrance plaza with decorations */}
      <View style={[styles.plaza, { width: sceneWidth }]}>
        <Text style={styles.plazaTitle}>🎪 Entrance Plaza</Text>
        <View style={styles.decoRow}>
          {DECORATIONS.filter((d) => progress.decorations.includes(d.id)).map((d) => (
            <Text key={d.id} style={styles.deco} accessibilityLabel={d.name}>
              {d.emoji}
            </Text>
          ))}
          {progress.decorations.length === 0 ? <Text style={styles.empty}>Buy decorations below to brighten it up.</Text> : null}
        </View>
      </View>

      {BIOMES.map((biome) => {
        const built = progress.habitats.includes(biome.id);
        const animals = ownedAnimals(biome);
        const canAfford = progress.coins >= biome.habitatCost;
        return (
          <View
            key={biome.id}
            style={[styles.habitat, { width: sceneWidth, backgroundColor: built ? biome.ground : colors.surface, borderColor: biome.color }]}
          >
            <View style={styles.habitatHeader}>
              <Text style={styles.habitatTitle}>
                {biome.emoji} {biome.name}
              </Text>
              <Text style={styles.habitatCount}>{animals.length}/9 animals</Text>
            </View>

            {built ? (
              <View style={{ height: HABITAT_HEIGHT }}>
                {biome.scenery.map((s, i) => (
                  <Text
                    key={i}
                    style={[styles.scenery, { left: ((i + 0.5) / biome.scenery.length) * sceneWidth - 20, top: i % 2 ? 20 : HABITAT_HEIGHT - 60 }]}
                  >
                    {s}
                  </Text>
                ))}
                {animals.map((a) => (
                  <WanderingAnimal
                    key={a.id}
                    animal={a}
                    width={sceneWidth - 22}
                    height={HABITAT_HEIGHT}
                    size={ANIMAL_SIZE}
                    onPress={() => sounds.playAnimal(a, animalsFor(biome.id).indexOf(a) + 1)}
                  />
                ))}
                {animals.length === 0 ? (
                  <Text style={[styles.empty, styles.habitatEmpty]}>
                    Clear {biome.name} levels or daily puzzles to collect stickers. Each one moves in here.
                  </Text>
                ) : null}
              </View>
            ) : (
              <View style={styles.build}>
                <Text style={styles.empty}>
                  {animals.length
                    ? `${animals.length} animal${animals.length === 1 ? ' is' : 's are'} waiting for a home!`
                    : 'An empty plot, ready to build.'}
                </Text>
                <Pressable
                  disabled={!canAfford}
                  onPress={() => purchased(buyHabitat(biome.id))}
                  style={({ pressed }) => [styles.buyButton, !canAfford && styles.buyDisabled, pressed && { opacity: 0.7 }]}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !canAfford }}
                >
                  <Text style={styles.buyText}>Build habitat · {biome.habitatCost} 🪙</Text>
                </Pressable>
              </View>
            )}
          </View>
        );
      })}

      <Text style={styles.section}>Decorations</Text>
      <View style={[styles.shop, { width: sceneWidth }]}>
        {DECORATIONS.map((d) => {
          const owned = progress.decorations.includes(d.id);
          const canAfford = progress.coins >= d.cost;
          return (
            <Pressable
              key={d.id}
              disabled={owned || !canAfford}
              onPress={() => purchased(buyDecoration(d.id, d.cost))}
              style={({ pressed }) => [styles.shopItem, owned && styles.shopOwned, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel={`${d.name}, ${owned ? 'owned' : `${d.cost} coins`}`}
              accessibilityState={{ disabled: owned || !canAfford }}
            >
              <Text style={styles.shopEmoji}>{d.emoji}</Text>
              <Text style={styles.shopName}>{d.name}</Text>
              <Text style={[styles.shopPrice, !owned && !canAfford && { opacity: 0.45 }]}>{owned ? '✓ Owned' : `${d.cost} 🪙`}</Text>
            </Pressable>
          );
        })}
      </View>

      <Dialog visible={badges.length > 0}>
        <Text style={styles.badgeIcon}>{badges[0]?.badge}</Text>
        <DialogTitle>Badge unlocked!</DialogTitle>
        {badges.map((b) => (
          <DialogText key={b.id}>
            {b.name}: {b.description} (+{b.coins} 🪙)
          </DialogText>
        ))}
        <DialogButton label="Yay!" primary onPress={() => setBadges([])} />
      </Dialog>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 14,
    alignItems: 'center',
  },
  intro: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 420,
  },
  plaza: {
    borderRadius: 20,
    padding: 14,
    backgroundColor: '#FFF1D6',
    borderWidth: 2,
    borderColor: colors.primary,
    gap: 8,
  },
  plazaTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  decoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    minHeight: 44,
    alignItems: 'center',
  },
  deco: {
    fontSize: 36,
  },
  habitat: {
    borderRadius: 20,
    borderWidth: 3,
    padding: 8,
    overflow: 'hidden',
  },
  habitatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingBottom: 4,
  },
  habitatTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  habitatCount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  scenery: {
    position: 'absolute',
    fontSize: 34,
    opacity: 0.8,
  },
  habitatEmpty: {
    marginTop: HABITAT_HEIGHT / 2 - 20,
    paddingHorizontal: 20,
  },
  empty: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  build: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 20,
  },
  buyButton: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  buyDisabled: {
    backgroundColor: colors.thinBorder,
  },
  buyText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  section: {
    alignSelf: 'stretch',
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  shop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  shopItem: {
    width: 100,
    alignItems: 'center',
    padding: 10,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.thinBorder,
    gap: 2,
  },
  shopOwned: {
    borderColor: colors.text,
    borderWidth: 2,
  },
  shopEmoji: {
    fontSize: 32,
  },
  shopName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  shopPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  badgeIcon: {
    fontSize: 48,
  },
});
