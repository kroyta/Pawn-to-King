import type { Color } from 'chess.js';
import type { GameResult } from './result';
import { applyResult, emptyRatings, type RatingChange, type RatingFormat, type Ratings } from './rating';
import { NO_HELP_BONUS_SHARE, TIP_ELO_FACTOR } from './tips';
import type { TournamentState } from './tournament';
import type { RivalState } from './rival';

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
  /** Turnierpartie: kein Einsatz, das Ergebnis zählt fürs Turnier */
  tournament?: boolean;
}

export interface SaveData {
  version: 3;
  balance: number;
  stats: { wins: number; draws: number; losses: number };
  ratings: Ratings;
  opponents: Record<string, OpponentRecord>;
  /** Laufende Partie. Der Einsatz ist beim Start schon abgezogen, ein Abbruch kostet ihn also. */
  activeMatch: ActiveMatch | null;
  /** Datum (JJJJ-MM-TT) der zuletzt gelösten Tagesaufgabe */
  dailySolved: string | null;
  /** Gekaufte Dinge (IDs aus shop.ts) */
  owned: string[];
  boardTheme: string;
  /** Gegner, über die ein Dossier gekauft wurde */
  dossiers: string[];
  tournament: TournamentState | null;
  /** Stadtfinale gewonnen: Der Bahnhof ist offen */
  cityFinalWon: boolean;
  /** Eigene Figur; null, solange sie noch nicht erstellt wurde */
  player: { name: string; look: string } | null;
  rival: RivalState;
}

export const START_BALANCE = 100;
/** Gewinn einer Gratis-Partie, wenn das Geld für keinen Einsatz reicht */
export const FREE_GAME_REWARD = 5;

export function newSave(): SaveData {
  return {
    version: 3,
    balance: START_BALANCE,
    stats: { wins: 0, draws: 0, losses: 0 },
    ratings: emptyRatings(),
    opponents: {},
    activeMatch: null,
    dailySolved: null,
    owned: [],
    boardTheme: 'classic',
    dossiers: [],
    tournament: null,
    cityFinalWon: false,
    player: null,
    rival: { place: null, matchesSince: 0 },
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

/** Geld ausgeben (Tipps, Einkäufe, Startgeld). null, wenn es nicht reicht. */
export function spend(save: SaveData, amount: number): SaveData | null {
  if (amount <= 0) return save;
  if (save.balance < amount) return null;
  return { ...save, balance: save.balance - amount };
}

/** Partie beginnen: Einsatz wird sofort einbehalten. */
export function startMatch(save: SaveData, match: ActiveMatch): SaveData {
  const amount = match.free || match.tournament ? 0 : match.stake;
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
  /** Bonus für einen Sieg ohne Tipps (in moneyDelta enthalten) */
  bonus: number;
  tipsUsed: number;
  tournament: boolean;
}

/**
 * Partie abrechnen.
 * Geld: Sieg bringt Einsatz zurück plus Gewinn in Höhe des Einsatzes, Remis den Einsatz zurück, Niederlage nichts.
 * Gratis-Partie: Sieg bringt eine kleine Belohnung, sonst passiert nichts.
 * Dazu Elo, Bilanz gegen diesen Gegner und Enthüllung seiner Stärke.
 */
export function settleMatch(save: SaveData, outcome: Outcome, { tipsUsed = 0 } = {}): Settlement | null {
  const m = save.activeMatch;
  if (!m) return null;

  let payout: number;
  let moneyDelta: number;
  let bonus = 0;
  if (m.tournament) {
    payout = 0;
    moneyDelta = 0;
  } else if (m.free) {
    payout = outcome === 'win' ? FREE_GAME_REWARD : 0;
    moneyDelta = payout;
  } else {
    payout = outcome === 'win' ? m.stake * 2 : outcome === 'draw' ? m.stake : 0;
    if (outcome === 'win' && tipsUsed === 0) bonus = Math.round(m.stake * NO_HELP_BONUS_SHARE);
    payout += bonus;
    moneyDelta = payout - m.stake;
  }

  const score = outcome === 'win' ? 1 : outcome === 'draw' ? 0.5 : 0;
  // Partien mit Tipps erhöhen die Elo kaum, damit die Einstufung stimmt
  const { ratings, change } = applyResult(save.ratings, m.format, m.opponentElo, score, tipsUsed > 0 ? TIP_ELO_FACTOR : 1);

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
    bonus,
    tipsUsed,
    tournament: !!m.tournament,
  };
}

/** Beim Laden: Eine noch offene Partie wurde abgebrochen und zählt als Niederlage. */
export function resolveAbandoned(save: SaveData): { save: SaveData; lost: number } | null {
  if (!save.activeMatch) return null;
  const lost = save.activeMatch.stake;
  const wasTournament = !!save.activeMatch.tournament;
  const settled = settleMatch(save, 'loss')!.save;
  // Eine abgebrochene Turnierpartie bedeutet das Aus im Turnier
  return { save: wasTournament ? { ...settled, tournament: null } : settled, lost };
}
