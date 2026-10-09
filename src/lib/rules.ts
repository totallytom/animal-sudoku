/** Rule twists and modifiers a level can have, with the kid-friendly explanations shown before play. */
export type RuleId = 'predator' | 'herds' | 'jigsaw' | 'habitat' | 'night' | 'runaway' | 'boss';

export interface RuleInfo {
  id: RuleId;
  name: string;
  emoji: string;
  /** One short sentence for the rule chip / intro. */
  summary: string;
  /** Longer explanation for the intro dialog. */
  howTo: string;
}

export const RULES: Record<RuleId, RuleInfo> = {
  predator: {
    id: 'predator',
    name: 'Predator & Prey',
    emoji: '🦁',
    summary: "Some animals can't sit side by side.",
    howTo: "On top of the normal rules, the pairs shown above the board can never be in squares that touch up, down, left or right. Touching corners is fine.",
  },
  herds: {
    id: 'herds',
    name: 'Pods',
    emoji: '🐬',
    summary: 'Each dashed group holds exactly the animals shown in its corner.',
    howTo: 'Squares inside a dashed outline are a pod. A pod contains exactly the animals pictured in its corner, each once, in some order. Work out who goes where!',
  },
  jigsaw: {
    id: 'jigsaw',
    name: 'Ice Floes',
    emoji: '🧊',
    summary: 'Wobbly ice floes replace the usual boxes.',
    howTo: 'The thick lines mark ice floes with odd shapes. Each floe needs every animal once, just like a normal box. Rows and columns work as usual.',
  },
  habitat: {
    id: 'habitat',
    name: 'Habitats',
    emoji: '🌳',
    summary: 'River and treetop squares only accept certain animals.',
    howTo: 'Squares marked 💧 or 🌳 are habitats. Only the animals listed above the board can live there. Use them as built-in clues!',
  },
  night: {
    id: 'night',
    name: 'Night Time',
    emoji: '🌙',
    summary: 'You can only see the squares near your lantern.',
    howTo: "It's dark! Only the squares around the one you've selected are lit up. Tap around the board to explore, and remember what you've seen.",
  },
  runaway: {
    id: 'runaway',
    name: 'Runaway Animal',
    emoji: '🏃',
    summary: 'Catch the runaway before it hops away!',
    howTo: 'A runaway animal is sitting in a square where it belongs. Place that animal there before its timer runs out to catch it for bonus coins. Too slow and it hops somewhere else!',
  },
  boss: {
    id: 'boss',
    name: 'Boss Puzzle',
    emoji: '👑',
    summary: 'Beat the clock to finish the world!',
    howTo: 'The final challenge of this world mixes its special rules and adds a time limit. Solve it before the clock hits zero to earn a boss badge and double coins.',
  },
};
