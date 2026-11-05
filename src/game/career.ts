import type { Color } from 'chess.js';
import type { GameResult } from './result';
import { applyResult, emptyRatings, type RatingChange, type RatingFormat, type Ratings } from './rating';

/** Spielstand des Spielers. Spielgeld ist rein virtuell. */
export interface OpponentRecord {
  games: number;
  wins: number;
  draws: number;
  losses: number;
  /** Zuletzt enthüllte Stärke */
  lastElo: number | null;
}

export interface ActiveMatch {
  opponentId: string;
  stake: number;
  free: boolean;
  /** Stärke des Gegners in dieser Partie (inkl. Tagesform) */
  opponentElo: number;
  format: RatingFormat;
}

export interface SaveData {
  version: 2;
  balance: number;
  stats: { wins: number; draws: number; losses: number };
  ratings: Ratings;
  opponents: Record<string, OpponentRecord>;
  /** Laufende Partie. Der Einsatz ist beim Start schon abgezogen, ein Abbruch kostet ihn also. */
  activeMatch: ActiveMatch | null;
}

export const START_BALANCE = 100;
/** Gewinn einer Gratis-Partie, wenn das Geld für keinen Einsatz reicht */
export const FREE_GAME_REWARD = 5;

export function newSave(): SaveData {
  return {
    version: 2,
    balance: START_BALANCE,
    stats: { wins: 0, draws: 0, losses: 0 },
    ratings: emptyRatings(),
    opponents: {},
    activeMatch: null,
  };
}

export type Outcome = 'win' | 'draw' | 'loss';

export function outcomeFor(result: GameResult, playerColor: Color): Outcome {
  if (result.winner === null) return 'draw';
  return result.winner === playerColor ? 'win' : 'loss';
}

export function canAfford(save: SaveData, stake: number): boolean {
  return save.balance >= stake;
}

export function recordOf(save: SaveData, opponentId: string): OpponentRecord {
  return save.opponents[opponentId] ?? { games: 0, wins: 0, draws: 0, losses: 0, lastElo: null };
}

/** Partie beginnen: Einsatz wird sofort einbehalten. */
export function startMatch(save: SaveData, match: ActiveMatch): SaveData {
  const amount = match.free ? 0 : match.stake;
  if (save.balance < amount) throw new Error('Nicht genug Geld');
  return { ...save, balance: save.balance - amount, activeMatch: { ...match, stake: amount } };
}

export interface Settlement {
  save: SaveData;
  outcome: Outcome;
  /** Veränderung des Kontostands gegenüber vor der Partie */
  moneyDelta: number;
  rating: RatingChange;
  /** Enthüllte Stärke des Gegners */
  opponentElo: number;
}

/**
 * Partie abrechnen.
 * Geld: Sieg bringt Einsatz zurück plus Gewinn in Höhe des Einsatzes, Remis den Einsatz zurück, Niederlage nichts.
 * Gratis-Partie: Sieg bringt eine kleine Belohnung, sonst passiert nichts.
 * Dazu Elo, Bilanz gegen diesen Gegner und Enthüllung seiner Stärke.
 */
export function settleMatch(save: SaveData, outcome: Outcome): Settlement | null {
  const m = save.activeMatch;
  if (!m) return null;

  let payout: number;
  let moneyDelta: number;
  if (m.free) {
    payout = outcome === 'win' ? FREE_GAME_REWARD : 0;
    moneyDelta = payout;
  } else {
    payout = outcome === 'win' ? m.stake * 2 : outcome === 'draw' ? m.stake : 0;
    moneyDelta = payout - m.stake;
  }

  const score = outcome === 'win' ? 1 : outcome === 'draw' ? 0.5 : 0;
  const { ratings, change } = applyResult(save.ratings, m.format, m.opponentElo, score);

  const key = outcome === 'win' ? 'wins' : outcome === 'draw' ? 'draws' : 'losses';
  const stats = { ...save.stats, [key]: save.stats[key] + 1 };
  const rec = recordOf(save, m.opponentId);
  const opponents = {
    ...save.opponents,
    [m.opponentId]: { ...rec, games: rec.games + 1, [key]: rec[key] + 1, lastElo: m.opponentElo },
  };

  return {
    save: { ...save, balance: save.balance + payout, stats, ratings, opponents, activeMatch: null },
    outcome,
    moneyDelta,
    rating: change,
    opponentElo: m.opponentElo,
  };
}

/** Beim Laden: Eine noch offene Partie wurde abgebrochen und zählt als Niederlage. */
export function resolveAbandoned(save: SaveData): { save: SaveData; lost: number } | null {
  if (!save.activeMatch) return null;
  const lost = save.activeMatch.stake;
  return { save: settleMatch(save, 'loss')!.save, lost };
}
