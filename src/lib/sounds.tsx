import { createAudioPlayer, setAudioModeAsync, useAudioPlayer, type AudioPlayer } from 'expo-audio';
import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';

import type { Animal } from './animals';

// Synthesized placeholder chirps, one per animal slot (1-9). An animal's own
// `sound` (a real recording) is used instead when provided.
const SLOT_SOUNDS = [
  require('../../assets/sounds/animal1.wav'),
  require('../../assets/sounds/animal2.wav'),
  require('../../assets/sounds/animal3.wav'),
  require('../../assets/sounds/animal4.wav'),
  require('../../assets/sounds/animal5.wav'),
  require('../../assets/sounds/animal6.wav'),
  require('../../assets/sounds/animal7.wav'),
  require('../../assets/sounds/animal8.wav'),
  require('../../assets/sounds/animal9.wav'),
];

export type Effect = 'complete' | 'win' | 'coin' | 'error';

interface SoundApi {
  playEffect: (effect: Effect) => void;
  /** `slot` is the animal's 1-based position in its set, used for the placeholder chirp. */
  playAnimal: (animal: Animal, slot: number) => void;
}

const SoundContext = createContext<SoundApi>({ playEffect: () => {}, playAnimal: () => {} });

function replay(player: AudioPlayer) {
  try {
    player.seekTo(0);
    player.play();
  } catch {
    // Audio is a nice-to-have; never let it break gameplay.
  }
}

export function SoundProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const complete = useAudioPlayer(require('../../assets/sounds/complete.wav'));
  const win = useAudioPlayer(require('../../assets/sounds/win.wav'));
  const coin = useAudioPlayer(require('../../assets/sounds/coin.wav'));
  const error = useAudioPlayer(require('../../assets/sounds/error.wav'));
  const slot1 = useAudioPlayer(SLOT_SOUNDS[0]);
  const slot2 = useAudioPlayer(SLOT_SOUNDS[1]);
  const slot3 = useAudioPlayer(SLOT_SOUNDS[2]);
  const slot4 = useAudioPlayer(SLOT_SOUNDS[3]);
  const slot5 = useAudioPlayer(SLOT_SOUNDS[4]);
  const slot6 = useAudioPlayer(SLOT_SOUNDS[5]);
  const slot7 = useAudioPlayer(SLOT_SOUNDS[6]);
  const slot8 = useAudioPlayer(SLOT_SOUNDS[7]);
  const slot9 = useAudioPlayer(SLOT_SOUNDS[8]);
  // Players for custom animal recordings, created on first use.
  const custom = useRef(new Map<string, AudioPlayer>());

  useEffect(() => {
    // Respect the silent switch and don't interrupt the player's music.
    setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
    const players = custom.current;
    return () => {
      players.forEach((p) => p.remove());
      players.clear();
    };
  }, []);

  const api = useMemo<SoundApi>(() => {
    const effects: Record<Effect, AudioPlayer> = { complete, win, coin, error };
    const slots = [slot1, slot2, slot3, slot4, slot5, slot6, slot7, slot8, slot9];
    return {
      playEffect: (effect) => {
        if (enabled) replay(effects[effect]);
      },
      playAnimal: (animal, slot) => {
        if (!enabled) return;
        if (animal.sound) {
          let player = custom.current.get(animal.id);
          if (!player) {
            player = createAudioPlayer(animal.sound);
            custom.current.set(animal.id, player);
          }
          replay(player);
        } else {
          replay(slots[(slot - 1) % slots.length]);
        }
      },
    };
  }, [enabled, complete, win, coin, error, slot1, slot2, slot3, slot4, slot5, slot6, slot7, slot8, slot9]);

  return <SoundContext.Provider value={api}>{children}</SoundContext.Provider>;
}

export function useSounds(): SoundApi {
  return useContext(SoundContext);
}
