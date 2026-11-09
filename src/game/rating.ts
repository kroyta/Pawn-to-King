import type { TimeControl } from './timeControls';

/**
 * Eigene Wertung des Spiels, keine FIDE- oder Online-Elo.
 * Je eine Zahl für Blitz, Schnellschach und Partien ohne Uhr, dazu eine gewichtete Gesamtwertung.
 */
export type RatingFormat = 'blitz' | 'rapid' | 'none';

export interface Rating {
  value: number;
  games: number;
}

export type Ratings = Record<RatingFormat, Rating | null>;

export const START_RATING = 800;
/** Bis zu so vielen Partien gilt die Wertung als vorläufig */
export const PROVISIONAL_GAMES = 5;
/** Partien ohne Uhr zählen in der Gesamtwertung weniger */
const FORMAT_WEIGHT: Record<RatingFormat, number> = { blitz: 1, rapid: 1, none: 0.5 };

export const emptyRatings = (): Ratings => ({ blitz: null, rapid: null, none: null });

export function formatOf(tc: TimeControl): RatingFormat {
  if (tc.initialMs === null) return 'none';
  return tc.initialMs <= 5 * 60_000 ? 'blitz' : 'rapid';
}

export function expectedScore(own: number, opponent: number): number {
  return 1 / (1 + 10 ** ((opponent - own) / 400));
}

/** Am Anfang ändert sich die Wertung schneller. */
function kFactor(games: number): number {
  if (games < 10) return 40;
  if (games < 30) return 24;
  return 16;
}

export interface Overall {
  value: number;
  games: number;
  provisional: boolean;
}

/** Gesamtwertung: gewichtet nach Zahl der Partien je Format. */
export function overallRating(r: Ratings): Overall {
  let sum = 0;
  let weight = 0;
  let games = 0;
  for (const f of ['blitz', 'rapid', 'none'] as const) {
    const x = r[f];
    if (!x || x.games === 0) continue;
    const w = x.games * FORMAT_WEIGHT[f];
    sum += x.value * w;
    weight += w;
    games += x.games;
  }
  const value = weight > 0 ? Math.round(sum / weight) : START_RATING;
  return { value, games, provisional: games < PROVISIONAL_GAMES };
}

export interface RatingChange {
  format: RatingFormat;
  before: number;
  after: number;
  delta: number;
}

/**
 * Wertung nach einer Partie anpassen. score: 1 Sieg, 0.5 Remis, 0 Niederlage.
 * Ein neues Format startet mit der Gesamtwertung.
 */
export function applyResult(
  r: Ratings, format: RatingFormat, opponentElo: number, score: number,
  /** Faktor für Gewinne, z. B. kleiner bei Partien mit Tipps. Verluste zählen immer voll. */
  gainFactor = 1,
): { ratings: Ratings; change: RatingChange } {
  const current = r[format] ?? { value: overallRating(r).value, games: 0 };
  let delta = Math.round(kFactor(current.games) * (score - expectedScore(current.value, opponentElo)));
  if (delta > 0) delta = Math.round(delta * gainFactor);
  const next: Rating = { value: Math.max(100, current.value + delta), games: current.games + 1 };
  return {
    ratings: { ...r, [format]: next },
    change: { format, before: current.value, after: next.value, delta: next.value - current.value },
  };
}
