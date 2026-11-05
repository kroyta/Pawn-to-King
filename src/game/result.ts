import type { Chess, Color } from 'chess.js';

export type EndReason =
  | 'checkmate'
  | 'timeout'
  | 'resignation'
  | 'stalemate'
  | 'threefold'
  | 'fiftyMove'
  | 'insufficient'
  | 'timeoutInsufficient';

export interface GameResult {
  /** null = Remis */
  winner: Color | null;
  reason: EndReason;
}

/** Prüft, ob die Partie nach den Brettregeln vorbei ist. */
export function boardResult(game: Chess): GameResult | null {
  if (game.isCheckmate()) return { winner: game.turn() === 'w' ? 'b' : 'w', reason: 'checkmate' };
  if (game.isStalemate()) return { winner: null, reason: 'stalemate' };
  if (game.isInsufficientMaterial()) return { winner: null, reason: 'insufficient' };
  if (game.isThreefoldRepetition()) return { winner: null, reason: 'threefold' };
  if (game.isDrawByFiftyMoves()) return { winner: null, reason: 'fiftyMove' };
  return null;
}

/**
 * Hat diese Farbe nur noch König oder König + eine Leichtfigur?
 * Dann kann sie nicht mehr gewinnen, und ein Zeitverlust des Gegners wird Remis.
 * (Vereinfachte Fassung der FIDE-Regel.)
 */
export function lacksMatingMaterial(game: Chess, color: Color): boolean {
  const pieces = game.board().flat().filter((p) => p && p.color === color && p.type !== 'k');
  if (pieces.length === 0) return true;
  return pieces.length === 1 && (pieces[0]!.type === 'n' || pieces[0]!.type === 'b');
}

export function timeoutResult(game: Chess, flagged: Color): GameResult {
  const other: Color = flagged === 'w' ? 'b' : 'w';
  if (lacksMatingMaterial(game, other)) return { winner: null, reason: 'timeoutInsufficient' };
  return { winner: other, reason: 'timeout' };
}
