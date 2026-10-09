export interface Decoration {
  id: string;
  name: string;
  emoji: string;
  cost: number;
}

/** Shown on the sanctuary's entrance plaza once bought. */
export const DECORATIONS: Decoration[] = [
  { id: 'flowers', name: 'Flower Bed', emoji: '🌷', cost: 30 },
  { id: 'tree', name: 'Shade Tree', emoji: '🌳', cost: 40 },
  { id: 'balloons', name: 'Balloons', emoji: '🎈', cost: 50 },
  { id: 'fountain', name: 'Fountain', emoji: '⛲', cost: 80 },
  { id: 'carousel', name: 'Carousel', emoji: '🎠', cost: 120 },
  { id: 'hut', name: "Keeper's Hut", emoji: '🏡', cost: 150 },
];
