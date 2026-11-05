import type { Color } from 'chess.js';
import type { GameResult } from './result';

/** Spielstand des Spielers. Spielgeld ist rein virtuell. */
export interface SaveData {
  version: 1;
  balance: number;
  stats: { wins: number; draws: number; losses: number };
  /** Laufende Partie. Der Einsatz ist beim Start schon abgezogen, ein Abbruch kostet ihn also. */
  activeMatch: { opponentId: string; stake: number; free: boolean } | null;
}

export const START_BALANCE = 100;
/** Gewinn einer Gratis-Partie, wenn das Geld für einen Einsatz nicht reicht */
export const FREE_GAME_REWARD = 5;

export function newSave(): SaveData {
  return { version: 1, balance: START_BALANCE, stats: { wins: 0, draws: 0, losses: 0 }, activeMatch: null };
}

export type Outcome = 'win' | 'draw' | 'loss';

export function outcomeFor(result: GameResult, playerColor: Color): Outcome {
  if (result.winner === null) return 'draw';
  return result.winner === playerColor ? 'win' : 'loss';
}

export function canAfford(save: SaveData, stake: number): boolean {
  return save.balance >= stake;
}

/** Partie beginnen: Einsatz wird sofort einbehalten. */
export function startMatch(save: SaveData, opponentId: string, stake: number, free = false): SaveData {
  const amount = free ? 0 : stake;
  if (save.balance < amount) throw new Error('Nicht genug Geld');
  return { ...save, balance: save.balance - amount, activeMatch: { opponentId, stake: amount, free } };
}

export interface Settlement {
  save: SaveData;
  outcome: Outcome;
  /** Veränderung des Kontostands gegenüber vor der Partie */
  delta: number;
}

/**
 * Partie abrechnen.
 * Sieg: Einsatz zurück plus Gewinn in Höhe des Einsatzes. Remis: Einsatz zurück. Niederlage: Einsatz weg.
 * Gratis-Partie: Sieg bringt eine kleine Belohnung, sonst passiert nichts.
 */
export function settleMatch(save: SaveData, outcome: Outcome): Settlement {
  const m = save.activeMatch;
  if (!m) return { save, outcome, delta: 0 };
  let payout = 0;
  let delta = 0;
  if (m.free) {
    payout = outcome === 'win' ? FREE_GAME_REWARD : 0;
    delta = payout;
  } else {
    payout = outcome === 'win' ? m.stake * 2 : outcome === 'draw' ? m.stake : 0;
    delta = payout - m.stake;
  }
  const stats = { ...save.stats };
  if (outcome === 'win') stats.wins++;
  else if (outcome === 'draw') stats.draws++;
  else stats.losses++;
  return { save: { ...save, balance: save.balance + payout, stats, activeMatch: null }, outcome, delta };
}

/** Beim Laden: Eine noch offene Partie wurde abgebrochen und zählt als Niederlage. */
export function resolveAbandoned(save: SaveData): { save: SaveData; lost: number } | null {
  if (!save.activeMatch) return null;
  const lost = save.activeMatch.stake;
  return { save: settleMatch(save, 'loss').save, lost };
}
