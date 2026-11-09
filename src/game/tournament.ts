import { expectedScore } from './rating';
import { dayElo, opponentById } from './opponents';
import { TIME_CONTROLS, type TimeControl } from './timeControls';
import type { Outcome } from './career';

/** Stadtturnier im K.-o.-System mit vier Spielern: Halbfinale und Finale. Startwerte für die Tests. */
export const CITY_TOURNAMENT = {
  entryFee: 150,
  prize: 1000,
  /** Lässt sich nicht kaufen */
  minElo: 900,
  /** Die drei anderen Teilnehmer */
  field: ['jojo', 'marlene', 'kevin'],
  /** Bedenkzeit je Runde: Halbfinale, Finale. Bei Remis entscheidet ein Blitz-Stechen. */
  roundTime: ['10+0', '15+10'],
  tiebreakTime: '3+0',
};

export interface TournamentState {
  /** 0 = Halbfinale, 1 = Finale */
  round: 0 | 1;
  opponentId: string;
  /** Das andere Halbfinale */
  otherSemi: [string, string];
  /** Nach einem Remis: Stechen im Blitz */
  tiebreak: boolean;
}

const tc = (id: string): TimeControl => TIME_CONTROLS.find((x) => x.id === id)!;

export function timeControlFor(state: TournamentState): TimeControl {
  return tc(state.tiebreak ? CITY_TOURNAMENT.tiebreakTime : CITY_TOURNAMENT.roundTime[state.round]);
}

/** Auslosung: zufälliger Halbfinal-Gegner, die anderen beiden spielen das zweite Halbfinale. */
export function drawTournament(rng: () => number = Math.random): TournamentState {
  const field = [...CITY_TOURNAMENT.field].sort(() => rng() - 0.5);
  return { round: 0, opponentId: field[0], otherSemi: [field[1], field[2]], tiebreak: false };
}

/** Das andere Halbfinale wird nach Spielstärke ausgewürfelt. */
export function simulateOtherSemi(state: TournamentState, rng: () => number = Math.random): string {
  const [a, b] = state.otherSemi.map((id) => opponentById(id)!);
  return rng() < expectedScore(dayElo(a), dayElo(b)) ? a.id : b.id;
}

export type TournamentStep =
  | { kind: 'tiebreak'; state: TournamentState }
  | { kind: 'final'; state: TournamentState }
  | { kind: 'won' }
  | { kind: 'lost' };

/** Wie es nach einer Turnierpartie weitergeht. */
export function advance(state: TournamentState, outcome: Outcome, rng: () => number = Math.random): TournamentStep {
  if (outcome === 'draw') return { kind: 'tiebreak', state: { ...state, tiebreak: true } };
  if (outcome === 'loss') return { kind: 'lost' };
  if (state.round === 1) return { kind: 'won' };
  const finalist = simulateOtherSemi(state, rng);
  return { kind: 'final', state: { ...state, round: 1, opponentId: finalist, tiebreak: false } };
}
