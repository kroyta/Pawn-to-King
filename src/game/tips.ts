import { Chess } from 'chess.js';
import type { CoachResult } from '../engine/coachAnalysis';
import { MATE, type RootMove } from '../engine/search';
import { t } from '../i18n/de';

export type TipKind = 'warning' | 'hint' | 'best' | 'undo';
export const TIP_KINDS: TipKind[] = ['warning', 'hint', 'best', 'undo'];

/** Preis als Anteil am Einsatz. Startwerte für die Tests. */
const PRICE_SHARE: Record<TipKind, number> = { warning: 0.05, hint: 0.1, best: 0.2, undo: 0.35 };
/** Höchstens so viele Tipps pro Partie */
export const MAX_TIPS_PER_GAME = 3;
/** Ab so vielen Centipawns Verlust gilt ein Zug als Fehler */
export const BLUNDER_LOSS = 150;
/** Bonus für einen Sieg ganz ohne Tipps, als Anteil am Einsatz */
export const NO_HELP_BONUS_SHARE = 0.25;
/** Elo-Gewinn mit Tipps wird so stark gekürzt, damit die Einstufung stimmt */
export const TIP_ELO_FACTOR = 0.25;

export function tipPrice(kind: TipKind, stake: number): number {
  return Math.max(1, Math.round(stake * PRICE_SHARE[kind]));
}

const isMate = (score: number) => score > MATE - 100;
const getsMated = (score: number) => score < -(MATE - 100);

/** Zug in deutscher Notation, z. B. Nf3 → Sf3, e8=Q → e8=D */
export function germanSan(san: string): string {
  return san.replace(/[KQRBN]/g, (c) => t.sanLetters[c]);
}

function describe(fen: string, uci: string) {
  const g = new Chess(fen);
  const m = g.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
  return { move: m, check: g.inCheck(), mate: g.isCheckmate() };
}

/** Bester Zug mit kurzer Erklärung, warum er gut ist. */
export function explainBest(fen: string, analysis: CoachResult): { from: string; to: string; text: string } {
  const best = analysis.moves[0];
  const { move, check, mate } = describe(fen, best.uci);
  const why: string[] = [];
  if (mate) return { from: move.from, to: move.to, text: `${t.tips.bestIs(germanSan(move.san))} ${t.tips.why.mate}` };
  if (isMate(best.score)) why.push(t.tips.why.mateSoon);
  if (move.captured) why.push(t.tips.why.captures(t.piecesAAcc[move.captured]));
  if (move.promotion) why.push(t.tips.why.promotes(t.promoteTo[move.promotion]));
  if (check && !mate) why.push(t.tips.why.check);
  if (why.length === 0) {
    const second = analysis.moves[1];
    if (second && best.score - second.score >= BLUNDER_LOSS) why.push(t.tips.why.onlyMove);
    else why.push(t.tips.why.improves);
  }
  return { from: move.from, to: move.to, text: `${t.tips.bestIs(germanSan(move.san))} ${why.join(' ')}` };
}

/** Hinweis: welche Figur wichtig ist, und ob eine Taktik in der Stellung steckt. */
export function hintFor(fen: string, analysis: CoachResult): { square: string; text: string } {
  const best = analysis.moves[0];
  const { move } = describe(fen, best.uci);
  const median = analysis.moves[Math.floor(analysis.moves.length / 2)]?.score ?? best.score;
  const tactic = isMate(best.score) || move.captured !== undefined || best.score - median >= 200;
  return {
    square: move.from,
    text: tactic ? t.tips.hintTactic(t.piecesYourAcc[move.piece]) : t.tips.hintQuiet(t.piecesYour[move.piece]),
  };
}

/**
 * Warnung: Ist dieser Zug ein Fehler? Gibt eine kurze Begründung oder null.
 * analysis bezieht sich auf die Stellung vor dem Zug.
 */
export function warningFor(analysis: CoachResult, uci: string): string | null {
  const best = analysis.moves[0];
  const chosen: RootMove | undefined = analysis.moves.find((m) => m.uci === uci);
  if (!chosen) return null;
  const loss = chosen.bound ? Infinity : best.score - chosen.score;
  if (loss < BLUNDER_LOSS) return null;
  if (getsMated(chosen.score)) return t.tips.warnMate;
  if (isMate(best.score)) return t.tips.warnMissedMate;
  return t.tips.warnMaterial;
}
