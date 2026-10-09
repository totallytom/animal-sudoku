import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable } from 'react-native';

import type { Animal } from '../lib/animals';
import { useReducedMotion } from '../lib/motion';
import { AnimalIcon } from './AnimalIcon';

interface Props {
  animal: Animal;
  /** Area the animal may roam in, relative to its habitat. */
  width: number;
  height: number;
  size: number;
  onPress: () => void;
}

/** An animal that strolls around its habitat, pauses, and hops when tapped. */
export function WanderingAnimal({ animal, width, height, size, onPress }: Props) {
  const reducedMotion = useReducedMotion();
  const maxX = Math.max(0, width - size);
  const maxY = Math.max(0, height - size);
  const [pos] = useState(() => new Animated.ValueXY({ x: 0, y: 0 }));
  const [facing] = useState(() => new Animated.Value(1));
  const [hop] = useState(() => new Animated.Value(0));

  useEffect(() => {
    // Start somewhere random; with reduced motion, the animal just stays there.
    let current = { x: Math.random() * maxX, y: Math.random() * maxY };
    pos.setValue(current);
    if (reducedMotion || !maxX) return;
    let alive = true;

    const step = () => {
      if (!alive) return;
      const target = { x: Math.random() * maxX, y: Math.random() * maxY };
      const distance = Math.hypot(target.x - current.x, target.y - current.y);
      // Emoji face left by default; mirror when walking right.
      facing.setValue(target.x > current.x ? -1 : 1);
      Animated.sequence([
        Animated.timing(pos, {
          toValue: target,
          duration: 1500 + distance * 25,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(600 + Math.random() * 2400),
      ]).start(({ finished }) => {
        current = target;
        if (finished) step();
      });
    };
    step();
    return () => {
      alive = false;
      pos.stopAnimation();
    };
  }, [reducedMotion, maxX, maxY, pos, facing]);

  const press = () => {
    onPress();
    hop.setValue(0);
    Animated.sequence([
      Animated.timing(hop, { toValue: 1, duration: 140, useNativeDriver: true }),
      Animated.spring(hop, { toValue: 0, friction: 3, useNativeDriver: true }),
    ]).start();
  };

  const translateY = hop.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.5] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        transform: [{ translateX: pos.x }, { translateY: pos.y }],
      }}
    >
      <Pressable onPress={press} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${animal.name}, tap to say hello`}>
        <Animated.View style={{ transform: [{ translateY }, { scaleX: facing }] }}>
          <AnimalIcon animal={animal} size={size} />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}
