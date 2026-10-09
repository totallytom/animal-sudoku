// Battle players are told apart by symbol AND color (Okabe-Ito, colorblind-safe), never color alone.
export interface PlayerStyle {
  symbol: string;
  color: string;
}

export const PLAYER_STYLES: PlayerStyle[] = [
  { symbol: '●', color: '#0072B2' },
  { symbol: '▲', color: '#D55E00' },
  { symbol: '■', color: '#009E73' },
  { symbol: '◆', color: '#CC79A7' },
];

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;

/** Route params carry names as JSON; fall back to defaults if anything is off. */
export function parsePlayers(raw: string | undefined): string[] {
  try {
    const names = JSON.parse(raw ?? '');
    if (Array.isArray(names) && names.length >= MIN_PLAYERS && names.length <= MAX_PLAYERS) {
      return names.map((n, i) => (typeof n === 'string' && n.trim() ? n.trim() : `Player ${i + 1}`));
    }
  } catch {
    // Use defaults below.
  }
  return ['Player 1', 'Player 2'];
}
