export const colors = {
  background: '#FFF8EE',
  surface: '#FFFFFF',
  text: '#3B2F2A',
  // Slightly deeper than before so small labels stay readable over the beach background.
  textMuted: '#6E6058',
  primary: '#F08A4B',
  border: '#3B2F2A',
  thinBorder: '#CDBFB4',
  mini: '#7CC8A4',
  six: '#6FB2E8',
  nine: '#B08AE0',
};

/** Lofi beach background: muted pastel sunset. */
export const beach = {
  sky: ['#A99BD3', '#E2B4CB', '#F7C9AC', '#FCE3C6'] as const,
  sun: ['#FFE6A8', '#F9B48E'] as const,
  sea: ['#B7DAD6', '#9CCBCB', '#8CBFC4'] as const,
  sand: ['#F5DFBF', '#EBCDA6'] as const,
  silhouette: '#5D4A66',
  /** Header bar matches the top of the sky so it blends in. */
  header: '#A99BD3',
};

/** Board state colors. Every state also has a shape cue (outline, ring, ✕ badge), so color is never the only signal. */
export interface BoardPalette {
  selected: string;
  selectedOutline: string;
  peer: string;
  matching: string;
  matchingRing: string;
  error: string;
  errorBg: string;
  /** When false, cells don't get per-animal tints and animals are told apart by shape alone. */
  animalTints: boolean;
}

const standard: BoardPalette = {
  selected: '#FFD08A',
  selectedOutline: '#3B2F2A',
  peer: '#FFF0D9',
  matching: '#FFE2A8',
  matchingRing: '#B9741F',
  error: '#E5484D',
  errorBg: '#FDE2E2',
  animalTints: true,
};

// Built on the Okabe-Ito palette (safe for red-green and blue-yellow color vision deficiencies).
const colorblind: BoardPalette = {
  selected: '#BFE1F7',
  selectedOutline: '#003F66',
  peer: '#EEF6FC',
  matching: '#DCEFFB',
  matchingRing: '#0072B2',
  error: '#D55E00',
  errorBg: '#FBE3D3',
  animalTints: false,
};

export function boardPalette(colorblindMode: boolean): BoardPalette {
  return colorblindMode ? colorblind : standard;
}
