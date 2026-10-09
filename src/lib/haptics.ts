import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';

import { useAnimals } from './animals';
import { useSettings } from './settings';
import { useSounds } from './sounds';

/** One place for "game feel": haptics + sounds, both respecting the player's settings. */
export function useFeedback() {
  const { settings } = useSettings();
  const sounds = useSounds();
  const animals = useAnimals();
  const haptics = settings.haptics;

  return useMemo(
    () => ({
      tap: () => {
        if (haptics) Haptics.selectionAsync();
      },
      /** A correct animal was placed: play its sound. */
      place: (value: number) => {
        if (haptics) Haptics.selectionAsync();
        sounds.playAnimal(animals[value - 1], value);
      },
      error: () => {
        if (haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        sounds.playEffect('error');
      },
      /** A row, column or box was completed. */
      unit: () => {
        if (haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        sounds.playEffect('complete');
      },
      win: () => {
        if (haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        sounds.playEffect('win');
      },
      coin: () => {
        if (haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        sounds.playEffect('coin');
      },
    }),
    [haptics, sounds, animals],
  );
}
