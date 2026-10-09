import { createContext, useContext } from 'react';
import type { AudioSource } from 'expo-audio';
import type { ImageSourcePropType } from 'react-native';

export type BiomeId = 'savanna' | 'ocean' | 'arctic' | 'jungle';

export interface Animal {
  id: string;
  name: string;
  /** Placeholder shown until a custom image is provided. */
  emoji: string;
  /** Background tint used when colorblind mode is off. Never the only cue. */
  color: string;
  /** Your artwork, e.g. require('../../assets/animals/lion.png'). */
  image?: ImageSourcePropType;
  /** The animal's call, e.g. require('../../assets/sounds/lion.mp3'). Falls back to a synthesized chirp. */
  sound?: AudioSource;
}

// Accessibility: animals in the same set must be distinguishable by SHAPE, not
// just color. Each set below mixes very different silhouettes. When drawing your
// own art, check each set in grayscale at ~30px. If two animals look alike,
// give one a stronger outline feature (ears, tail, pose).
//
// Within a set, value 1 is the first animal, value 2 the second, and so on.
// 4x4 uses the first 4 animals, 6x6 the first 6, and 9x9 all 9, so put the most
// distinct-looking animals first.

/** Quick play and battles. */
export const STARTER_ANIMALS: Animal[] = [
  { id: 'elephant', name: 'Elephant', emoji: '🐘', color: '#DDE6EE' },
  { id: 'giraffe', name: 'Giraffe', emoji: '🦒', color: '#FFF0B8' },
  { id: 'turtle', name: 'Turtle', emoji: '🐢', color: '#D5F2D0' },
  { id: 'penguin', name: 'Penguin', emoji: '🐧', color: '#E4E7EB' },
  { id: 'butterfly', name: 'Butterfly', emoji: '🦋', color: '#D6E9FF' },
  { id: 'octopus', name: 'Octopus', emoji: '🐙', color: '#FCE1EC' },
  { id: 'snail', name: 'Snail', emoji: '🐌', color: '#F1E4D3' },
  { id: 'crab', name: 'Crab', emoji: '🦀', color: '#FFD9CC' },
  { id: 'whale', name: 'Whale', emoji: '🐳', color: '#CDEFF5' },
];

export const BIOME_ANIMALS: Record<BiomeId, Animal[]> = {
  savanna: [
    { id: 'lion', name: 'Lion', emoji: '🦁', color: '#FFE3B0' },
    { id: 'giraffe', name: 'Giraffe', emoji: '🦒', color: '#FFF0B8' },
    { id: 'elephant', name: 'Elephant', emoji: '🐘', color: '#DDE6EE' },
    { id: 'flamingo', name: 'Flamingo', emoji: '🦩', color: '#FCD9E6' },
    { id: 'zebra', name: 'Zebra', emoji: '🦓', color: '#ECECEC' },
    { id: 'crocodile', name: 'Crocodile', emoji: '🐊', color: '#D5EBC8' },
    { id: 'rhino', name: 'Rhino', emoji: '🦏', color: '#E2DDD8' },
    { id: 'hippo', name: 'Hippo', emoji: '🦛', color: '#E6D9EE' },
    { id: 'buffalo', name: 'Buffalo', emoji: '🐃', color: '#E8DCCB' },
  ],
  ocean: [
    { id: 'whale', name: 'Whale', emoji: '🐳', color: '#CDEFF5' },
    { id: 'octopus', name: 'Octopus', emoji: '🐙', color: '#FCE1EC' },
    { id: 'crab', name: 'Crab', emoji: '🦀', color: '#FFD9CC' },
    { id: 'turtle', name: 'Turtle', emoji: '🐢', color: '#D5F2D0' },
    { id: 'dolphin', name: 'Dolphin', emoji: '🐬', color: '#D6E9FF' },
    { id: 'shark', name: 'Shark', emoji: '🦈', color: '#DCE3EA' },
    { id: 'squid', name: 'Squid', emoji: '🦑', color: '#FDE2D6' },
    { id: 'blowfish', name: 'Blowfish', emoji: '🐡', color: '#FFF0B8' },
    { id: 'shrimp', name: 'Shrimp', emoji: '🦐', color: '#FFE0D1' },
  ],
  arctic: [
    { id: 'penguin', name: 'Penguin', emoji: '🐧', color: '#E4E7EB' },
    { id: 'polar-bear', name: 'Polar Bear', emoji: '🐻‍❄️', color: '#EEF3F7' },
    { id: 'seal', name: 'Seal', emoji: '🦭', color: '#DCE3EA' },
    { id: 'reindeer', name: 'Reindeer', emoji: '🦌', color: '#EADBC8' },
    { id: 'owl', name: 'Snowy Owl', emoji: '🦉', color: '#F1E9DA' },
    { id: 'wolf', name: 'Wolf', emoji: '🐺', color: '#DDE1E6' },
    { id: 'hare', name: 'Arctic Hare', emoji: '🐇', color: '#F3EEF7' },
    { id: 'musk-ox', name: 'Musk Ox', emoji: '🦬', color: '#E3D5C5' },
    { id: 'swan', name: 'Tundra Swan', emoji: '🦢', color: '#E8F1F8' },
  ],
  jungle: [
    { id: 'monkey', name: 'Monkey', emoji: '🐒', color: '#EADBC8' },
    { id: 'tiger', name: 'Tiger', emoji: '🐅', color: '#FFE0B8' },
    { id: 'parrot', name: 'Parrot', emoji: '🦜', color: '#D5F2D0' },
    { id: 'snake', name: 'Snake', emoji: '🐍', color: '#E3F2C8' },
    { id: 'frog', name: 'Frog', emoji: '🐸', color: '#D0F0D8' },
    { id: 'sloth', name: 'Sloth', emoji: '🦥', color: '#E6DCD0' },
    { id: 'butterfly', name: 'Butterfly', emoji: '🦋', color: '#D6E9FF' },
    { id: 'lizard', name: 'Chameleon', emoji: '🦎', color: '#DDF0C8' },
    { id: 'bat', name: 'Bat', emoji: '🦇', color: '#E4DDEA' },
  ],
};

/** The animal set used by the board currently on screen. */
export const AnimalSetContext = createContext<Animal[]>(STARTER_ANIMALS);

export function useAnimals(): Animal[] {
  return useContext(AnimalSetContext);
}
