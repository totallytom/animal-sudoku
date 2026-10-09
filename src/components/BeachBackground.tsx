import { useIsFocused } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useEffect, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, useWindowDimensions, View } from 'react-native';

import { useReducedMotion } from '../lib/motion';
import { beach } from '../lib/theme';

// Where the sea meets the sky, as a fraction of screen height. Kept low so most
// content sits over the light sky.
const HORIZON = 0.7;
const SHORE = 0.86;

/**
 * Lofi beach scene drawn behind every screen: pastel sunset sky, striped retro sun,
 * drifting clouds, a shimmering sea, sand, a swaying palm and a light film grain.
 * Motion is slow and stops when the screen isn't focused or "reduce motion" is on.
 */
export const BeachBackground = memo(function BeachBackground({ showPalm = false }: { showPalm?: boolean }) {
  const { width, height } = useWindowDimensions();
  const focused = useIsFocused();
  const reducedMotion = useReducedMotion();
  const animate = focused && !reducedMotion;

  const horizonY = height * HORIZON;
  const shoreY = height * SHORE;
  const sunSize = Math.min(width * 0.46, 230);

  return (
    <View pointerEvents="none" style={styles.root} importantForAccessibility="no-hide-descendants">
      {/* Sky */}
      <LinearGradient colors={beach.sky} locations={[0, 0.45, 0.8, 1]} style={[styles.layer, { height: horizonY + 2 }]} />

      {/* Retro sun, half sunk below the horizon */}
      <View
        style={[
          styles.sun,
          { width: sunSize, height: sunSize, borderRadius: sunSize / 2, left: (width - sunSize) / 2, top: horizonY - sunSize * 0.62 },
        ]}
      >
        <LinearGradient colors={beach.sun} style={StyleSheet.absoluteFill} />
        {/* Retro stripes across the visible lower half, thickening toward the horizon */}
        {[0.34, 0.43, 0.51, 0.58].map((y, k) => (
          <View key={k} style={[styles.sunStripe, { top: sunSize * y, height: 2 + k * 1.8 }]} />
        ))}
      </View>

      <Cloud animate={animate} width={width} top={height * 0.1} scale={1} duration={95000} offset={0.15} />
      <Cloud animate={animate} width={width} top={height * 0.2} scale={0.7} duration={120000} offset={0.65} />
      <Cloud animate={animate} width={width} top={height * 0.04} scale={0.55} duration={140000} offset={0.4} />
      <Birds animate={animate} width={width} top={height * 0.15} />

      {/* Sea */}
      <LinearGradient colors={beach.sea} style={[styles.layer, { top: horizonY, height: shoreY - horizonY + 20 }]} />
      <Shimmer animate={animate} top={horizonY + 6} />
      {[0.25, 0.5, 0.75].map((f, k) => (
        <WaveLine key={k} animate={animate} width={width} top={horizonY + (shoreY - horizonY) * f} delay={k * 1400} />
      ))}

      {/* Sand with a washing foam line */}
      <Foam animate={animate} width={width} top={shoreY - 8} />
      {/* A very wide dome, so its top edge reads as a gently curved shoreline */}
      <LinearGradient
        colors={beach.sand}
        style={[
          styles.sand,
          { top: shoreY, height: height - shoreY + width, width: width * 1.6, left: -width * 0.3, borderTopLeftRadius: width * 0.8, borderTopRightRadius: width * 0.8 },
        ]}
      />

      {showPalm ? <Palm animate={animate} height={height} left={width - Math.min(150, width * 0.36)} bottom={height - shoreY - 18} /> : null}

      <Grain width={width} height={height} />
    </View>
  );
});

const GRAIN_TILE = 256;

/** Lofi film grain, tiled by hand so it looks the same on every platform. */
function Grain({ width, height }: { width: number; height: number }) {
  const cols = Math.ceil(width / GRAIN_TILE);
  const rows = Math.ceil(height / GRAIN_TILE);
  return (
    <View style={[styles.grain, { width: cols * GRAIN_TILE }]}>
      {Array.from({ length: cols * rows }, (_, k) => (
        <Image key={k} source={require('../../assets/background/grain.png')} style={styles.grainTile} />
      ))}
    </View>
  );
}

/** Loops an Animated.Value 0→1 (or ping-pong) while `animate` is true. */
function useLoop(animate: boolean, duration: number, { pingPong = false, delay = 0, from = 0 } = {}) {
  const [value] = useState(() => new Animated.Value(from));
  useEffect(() => {
    if (!animate) return;
    const anim = pingPong
      ? Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(value, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(value, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          ]),
        )
      : Animated.loop(Animated.timing(value, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }));
    anim.start();
    return () => anim.stop();
  }, [animate, duration, pingPong, delay, value]);
  return value;
}

function Cloud({
  animate,
  width,
  top,
  scale,
  duration,
  offset,
}: {
  animate: boolean;
  width: number;
  top: number;
  scale: number;
  duration: number;
  offset: number;
}) {
  const t = useLoop(animate, duration, { from: offset });
  const cloudWidth = 150 * scale;
  const translateX = t.interpolate({ inputRange: [0, 1], outputRange: [-cloudWidth, width + cloudWidth] });
  return (
    <Animated.View style={[styles.cloud, { top, width: cloudWidth, height: 46 * scale, transform: [{ translateX }] }]}>
      <View style={[styles.puff, { left: 0, bottom: 0, width: cloudWidth, height: 26 * scale, borderRadius: 13 * scale }]} />
      <View style={[styles.puff, { left: 22 * scale, bottom: 10 * scale, width: 56 * scale, height: 36 * scale, borderRadius: 18 * scale }]} />
      <View style={[styles.puff, { left: 62 * scale, bottom: 8 * scale, width: 64 * scale, height: 42 * scale, borderRadius: 21 * scale }]} />
    </Animated.View>
  );
}

function Birds({ animate, width, top }: { animate: boolean; width: number; top: number }) {
  const t = useLoop(animate, 4200, { pingPong: true });
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  return (
    <Animated.Text style={[styles.birds, { top, left: width * 0.18, transform: [{ translateY }] }]}>
      {'︶ ︶\n   ︶'}
    </Animated.Text>
  );
}

function Shimmer({ animate, top }: { animate: boolean; top: number }) {
  const t = useLoop(animate, 2600, { pingPong: true });
  const opacity = t.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.8] });
  return (
    <Animated.View style={{ position: 'absolute', top, left: 0, right: 0, alignItems: 'center', opacity }}>
      {[90, 64, 44, 28, 16].map((w, k) => (
        <View key={k} style={[styles.shimmer, { width: w, marginTop: k ? 7 : 0, transform: [{ translateX: (k % 2 ? 1 : -1) * 6 }] }]} />
      ))}
    </Animated.View>
  );
}

function WaveLine({ animate, width, top, delay }: { animate: boolean; width: number; top: number; delay: number }) {
  const t = useLoop(animate, 5000, { pingPong: true, delay });
  const translateX = t.interpolate({ inputRange: [0, 1], outputRange: [-14, 14] });
  return (
    <Animated.View style={[styles.waveRow, { top, width: width + 60, transform: [{ translateX }] }]}>
      {Array.from({ length: Math.ceil(width / 70) + 2 }, (_, k) => (
        <View key={k} style={[styles.wave, { marginLeft: k % 2 ? 34 : 22 }]} />
      ))}
    </Animated.View>
  );
}

function Foam({ animate, width, top }: { animate: boolean; width: number; top: number }) {
  const t = useLoop(animate, 3800, { pingPong: true });
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, 7] });
  const bubbles = Math.ceil(width / 22) + 2;
  return (
    <Animated.View style={[styles.foam, { top, width: width + 40, transform: [{ translateY }] }]}>
      {Array.from({ length: bubbles }, (_, k) => (
        <View key={k} style={[styles.bubble, { width: 26 + (k % 3) * 6, height: 14 + (k % 2) * 4 }]} />
      ))}
    </Animated.View>
  );
}

function Palm({ animate, height, left, bottom }: { animate: boolean; height: number; left: number; bottom: number }) {
  const t = useLoop(animate, 4800, { pingPong: true });
  const rotate = t.interpolate({ inputRange: [0, 1], outputRange: ['-1.5deg', '2deg'] });
  const trunkHeight = Math.min(240, height * 0.3);
  const segments = 16;
  const segmentHeight = trunkHeight / segments;
  // Trunk curves gently left as it rises; the crown sits on top of the last segment.
  const lean = (f: number) => 40 - f * f * 34;
  return (
    <Animated.View
      style={[styles.palm, { left, bottom, height: trunkHeight + 80, transformOrigin: 'bottom left', transform: [{ rotate }] }]}
    >
      {Array.from({ length: segments }, (_, k) => {
        const f = k / (segments - 1);
        return (
          <View
            key={k}
            style={[
              styles.trunk,
              {
                bottom: k * segmentHeight,
                left: lean(f),
                width: 15 - f * 6,
                height: segmentHeight + 8, // overlap so the trunk reads as one piece
                transform: [{ rotate: `${-4 - f * 12}deg` }],
              },
            ]}
          />
        );
      })}
      <View style={[styles.crown, { bottom: trunkHeight - 4, left: lean(1) + 4 }]}>
        {[-165, -135, -100, -62, -28, 5].map((deg, k) => (
          <Frond key={k} angle={deg} length={58 + (k % 2) * 12} />
        ))}
      </View>
    </Animated.View>
  );
}

/** A palm frond: a leaf whose outer half droops, so it arcs downward like a real palm. */
function Frond({ angle, length }: { angle: number; length: number }) {
  const pointsLeft = angle < -90;
  const droop = pointsLeft ? -32 : 32;
  const inner = length * 0.55;
  return (
    <View style={[styles.frondArm, { transformOrigin: 'left center', transform: [{ rotate: `${angle}deg` }] }]}>
      <View style={[styles.leaf, { width: inner + 8, height: 13 }]} />
      <View
        style={[
          styles.leaf,
          styles.leafTip,
          { left: inner, width: length - inner, transformOrigin: 'left center', transform: [{ rotate: `${droop}deg` }] },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    // Wide decorative layers must never widen the page (web) or catch touches.
    overflow: 'hidden',
  },
  grain: {
    position: 'absolute',
    top: 0,
    left: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  grainTile: {
    width: GRAIN_TILE,
    height: GRAIN_TILE,
  },
  layer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  sun: {
    position: 'absolute',
    overflow: 'hidden',
    opacity: 0.92,
  },
  sunStripe: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: beach.sky[3],
  },
  cloud: {
    position: 'absolute',
    left: 0,
    opacity: 0.55,
  },
  puff: {
    position: 'absolute',
    backgroundColor: '#FFF6F0',
  },
  birds: {
    position: 'absolute',
    fontSize: 13,
    lineHeight: 14,
    color: beach.silhouette,
    opacity: 0.55,
  },
  shimmer: {
    height: 3,
    borderRadius: 2,
    backgroundColor: '#FFF1D2',
  },
  waveRow: {
    position: 'absolute',
    left: -30,
    flexDirection: 'row',
  },
  wave: {
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    opacity: 0.4,
  },
  foam: {
    position: 'absolute',
    left: -20,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  bubble: {
    marginRight: -14,
    borderRadius: 12,
    backgroundColor: '#FFFDF8',
    opacity: 0.7,
  },
  sand: {
    position: 'absolute',
  },
  palm: {
    position: 'absolute',
    width: 140,
    opacity: 0.82,
  },
  trunk: {
    position: 'absolute',
    borderRadius: 8,
    backgroundColor: beach.silhouette,
  },
  crown: {
    position: 'absolute',
    width: 0,
    height: 0,
  },
  frondArm: {
    position: 'absolute',
    left: 0,
    top: -6,
    width: 0,
    height: 13,
  },
  leaf: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 7,
    backgroundColor: beach.silhouette,
  },
  leafTip: {
    height: 10,
    top: 1.5,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
});
