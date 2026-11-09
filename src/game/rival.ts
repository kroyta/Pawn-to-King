import { recordOf, type SaveData } from './career';
import { opponentById, type Opponent } from './opponents';
import type { PlaceId } from './places';
import { overallRating } from './rating';
import { TIME_CONTROLS } from './timeControls';

/** Der Rivale: taucht immer wieder auf, wächst mit dem Spieler und steht im Stadtfinale. */
export const RIVAL_ID = 'leo';

export interface RivalState {
  /** Wo er gerade wartet; null = nicht in der Stadt unterwegs */
  place: PlaceId | null;
  /** Partien gegen andere seit der letzten Begegnung */
  matchesSince: number;
}

export const newRivalState = (): RivalState => ({ place: null, matchesSince: 0 });

const RIVAL_PLACES: PlaceId[] = ['park', 'cafe', 'club'];

/** Startwerte für die Tests */
const ELO_LEAD = 75;
const FIRST_APPEARANCE_AFTER = 1;
const APPEARANCE_EVERY = 3;

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

/** Der Rivale als Gegner: immer etwas stärker als du, Einsatz passend zu deinem Kontostand. */
export function rivalOpponent(save: SaveData): Opponent {
  const elo = clamp(overallRating(save.ratings).value + ELO_LEAD, 700, 2000);
  const stake = clamp(Math.round((save.balance * 0.2) / 10) * 10, 30, 1000);
  return {
    id: RIVAL_ID,
    place: save.rival.place ?? 'park',
    elo,
    stake,
    timeControl: TIME_CONTROLS.find((x) => x.id === '10+0')!,
    style: { greed: 20, temperature: 30 },
    avatar: { initials: 'LL', color: '#5E8A4E' },
  };
}

/** Nach einer Partie: Begegnung mit dem Rivalen abschließen oder sein nächstes Auftauchen vorbereiten. */
export function afterMatch(save: SaveData, opponentId: string, rng: () => number = Math.random): SaveData {
  if (opponentId === RIVAL_ID) return { ...save, rival: newRivalState() };
  const r = save.rival;
  if (r.place) return save;
  const matchesSince = r.matchesSince + 1;
  const due = recordOf(save, RIVAL_ID).games === 0 ? FIRST_APPEARANCE_AFTER : APPEARANCE_EVERY;
  if (matchesSince < due) return { ...save, rival: { ...r, matchesSince } };
  const place = RIVAL_PLACES[Math.floor(rng() * RIVAL_PLACES.length)];
  return { ...save, rival: { place, matchesSince: 0 } };
}

export type RivalMood = 'first' | 'leading' | 'trailing' | 'even';

/** Wie er dich begrüßt, hängt von eurer Bilanz ab. */
export function rivalMood(save: SaveData): RivalMood {
  const rec = recordOf(save, RIVAL_ID);
  if (rec.games === 0) return 'first';
  // Seine Siege sind deine Niederlagen
  if (rec.losses > rec.wins) return 'leading';
  if (rec.wins > rec.losses) return 'trailing';
  return 'even';
}

export function placeRival(save: SaveData, rng: () => number = Math.random): SaveData {
  const place = RIVAL_PLACES[Math.floor(rng() * RIVAL_PLACES.length)];
  return { ...save, rival: { place, matchesSince: 0 } };
}

/** Gegner nach ID, einschließlich des Rivalen */
export function anyOpponent(id: string, save: SaveData): Opponent {
  return id === RIVAL_ID ? rivalOpponent(save) : opponentById(id)!;
}
