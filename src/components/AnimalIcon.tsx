import { Image, StyleSheet, Text, View } from 'react-native';

import { useAnimals, type Animal } from '../lib/animals';
import { useSettings } from '../lib/settings';
import { colors } from '../lib/theme';

interface Props {
  /** 1-based value in the current animal set... */
  value?: number;
  /** ...or a specific animal (sticker album, sanctuary). */
  animal?: Animal;
  size: number;
  dimmed?: boolean;
  /** Show a small number in the corner, so animals can be told apart without relying on the art. */
  badge?: boolean;
  /** Draw as a dark silhouette (not-yet-collected stickers). */
  silhouette?: boolean;
}

// Below this size (pencil-mark notes) a frame would swallow the animal, so it's skipped.
const MIN_FRAMED_SIZE = 16;
// The animal's share of the frame when framed, leaving a rim of token around it.
const FRAMED_ART_SCALE = 0.78;

export function AnimalIcon({ value, animal: animalProp, size, dimmed, badge, silhouette }: Props) {
  const animals = useAnimals();
  const { settings } = useSettings();
  const animal = animalProp ?? animals[(value ?? 1) - 1];
  const opacity = dimmed ? 0.35 : silhouette ? 0.18 : 1;
  // Optional "token" look: a round frame drawn behind the art. The art itself stays
  // unframed, so the animal's outline (the colorblind-friendly cue) is never hidden.
  const framed = settings.animalFrames && !silhouette && size >= MIN_FRAMED_SIZE;
  const artSize = framed ? size * FRAMED_ART_SCALE : size;

  const art = animal.image ? (
    <Image
      source={animal.image}
      style={{ width: artSize, height: artSize, opacity, tintColor: silhouette ? colors.text : undefined }}
      resizeMode="contain"
      accessibilityLabel={animal.name}
    />
  ) : (
    <Text
      style={{ fontSize: artSize * 0.8, lineHeight: artSize, textAlign: 'center', opacity }}
      accessibilityLabel={silhouette ? 'Not collected yet' : animal.name}
    >
      {animal.emoji}
    </Text>
  );

  const icon = framed ? (
    <View
      style={[
        styles.frame,
        { width: size, height: size, borderRadius: size / 2, borderWidth: Math.max(1, size * 0.04) },
        dimmed && { opacity: 0.5 },
      ]}
    >
      {art}
    </View>
  ) : (
    art
  );

  if (!badge || !value) return icon;

  const badgeSize = Math.max(12, size * 0.38);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {icon}
      <View
        style={[
          styles.badge,
          { width: badgeSize, height: badgeSize, borderRadius: badgeSize / 2, right: -badgeSize * 0.2, bottom: -badgeSize * 0.15 },
        ]}
      >
        <Text style={[styles.badgeText, { fontSize: badgeSize * 0.68 }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,253,248,0.92)',
    borderColor: 'rgba(59,47,42,0.22)',
  },
  badge: {
    position: 'absolute',
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontWeight: '800',
    includeFontPadding: false,
  },
});
