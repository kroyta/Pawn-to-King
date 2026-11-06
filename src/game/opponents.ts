import type { StrengthProfile } from '../engine/humanPlayer';
import { TIME_CONTROLS, type TimeControl } from './timeControls';

import type { PlaceId } from './places';
export type { PlaceId };

export interface Opponent {
  id: string;
  place: PlaceId;
  /** Grundstärke, bleibt fest. Dazu kommt die Tagesform. */
  elo: number;
  /** Fester, sichtbarer Einsatz in € */
  stake: number;
  /** Die Bedenkzeit gehört zur Persönlichkeit */
  timeControl: TimeControl;
  /** Mindest-Elo (Gesamtwertung) für diesen Gegner. Lässt sich nicht kaufen. */
  minElo?: number;
  /** Spielstil: weicht vom Standardprofil der Stärke ab */
  style?: Partial<Omit<StrengthProfile, 'elo' | 'depth'>>;
  avatar: { initials: string; color: string };
}

const tc = (id: string) => TIME_CONTROLS.find((x) => x.id === id)!;

// Texte (Name, Ruf, Sprüche) stehen in i18n unter opponents.<id>.
export const OPPONENTS: Opponent[] = [
  {
    id: 'heinz', place: 'park', elo: 600, stake: 20, timeControl: tc('none'),
    style: { greed: 40 },
    avatar: { initials: 'HS', color: '#2F8A9C' },
  },
  {
    id: 'jojo', place: 'park', elo: 850, stake: 40, timeControl: tc('3+2'),
    style: { greed: 60, temperature: 90 },
    avatar: { initials: 'BJ', color: '#E9A81C' },
  },
  {
    id: 'marlene', place: 'cafe', elo: 1050, stake: 150, timeControl: tc('10+0'),
    style: { temperature: 30, blunderChance: 0.06, greed: 0 },
    avatar: { initials: 'MK', color: '#7A5C8E' },
  },
  {
    id: 'kevin', place: 'cafe', elo: 1200, stake: 250, timeControl: tc('10+0'),
    style: { greed: 50, blunderChance: 0.12, maxBlunder: 500 },
    avatar: { initials: 'GK', color: '#BE4128' },
  },
  {
    id: 'albrecht', place: 'club', elo: 1500, stake: 2000, timeControl: tc('15+10'), minElo: 1000,
    style: { greed: 0 },
    avatar: { initials: 'AR', color: '#16323F' },
  },
];

export const OPPONENT_PLACES: PlaceId[] = ['park', 'cafe', 'club'];

export function opponentById(id: string): Opponent | undefined {
  return OPPONENTS.find((o) => o.id === id);
}

/** Kleine, feste Pseudo-Zufallszahl aus einem Text, im Bereich [0, 1). */
function hash01(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10_000) / 10_000;
}

/** Tagesform: Jeder Gegner schwankt von Tag zu Tag um bis zu ±60. */
export function dayElo(o: Opponent, date = new Date()): number {
  const day = date.toISOString().slice(0, 10);
  return o.elo + Math.round((hash01(`${o.id}:${day}`) - 0.5) * 120);
}

/**
 * Geschätzte Spanne für einen bekannten Gegner. Wird mit jeder Partie enger,
 * zeigt aber nie die genaue Zahl. Die Mitte liegt absichtlich nicht genau auf der Grundstärke.
 */
export function knownRange(o: Opponent, gamesPlayed: number): [number, number] | null {
  if (gamesPlayed <= 0) return null;
  const half = gamesPlayed === 1 ? 175 : gamesPlayed === 2 ? 125 : gamesPlayed < 5 ? 100 : 75;
  const center = o.elo + Math.round((hash01(`${o.id}:center`) - 0.5) * 80);
  const round = (x: number) => Math.round(x / 25) * 25;
  return [round(center - half), round(center + half)];
}
