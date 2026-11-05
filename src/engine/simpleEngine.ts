import { Chess, type Move } from 'chess.js';
import type { ChessEngine } from './types';

const PIECE_VALUE: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

// Kleiner Bonus für Figuren im Zentrum (Index 0..7 je Achse).
const CENTER = [0, 1, 2, 3, 3, 2, 1, 0];

export interface SimpleEngineOptions {
  /** Suchtiefe in Halbzügen (1–3 ist sinnvoll). */
  depth?: number;
  /** Zufallsrauschen in Centipawns, macht den Gegner weniger berechenbar. */
  noise?: number;
  /** Wahrscheinlichkeit (0–1), dass statt des besten ein zufälliger Zug gespielt wird. */
  blunderChance?: number;
}

function evaluate(game: Chess): number {
  // Bewertung aus Sicht von Weiß.
  let score = 0;
  const board = game.board();
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const sq = board[r][f];
      if (!sq) continue;
      let v = PIECE_VALUE[sq.type];
      if (sq.type === 'n' || sq.type === 'b' || sq.type === 'p') v += (CENTER[r] + CENTER[f]) * 4;
      if (sq.type === 'p') v += (sq.color === 'w' ? 6 - r : r - 1) * 5; // Vorrücken belohnen
      score += sq.color === 'w' ? v : -v;
    }
  }
  return score;
}

function orderMoves(moves: Move[]): Move[] {
  return moves.sort((a, b) => (b.captured ? PIECE_VALUE[b.captured] : 0) - (a.captured ? PIECE_VALUE[a.captured] : 0));
}

const MATE = 100_000;

function negamax(game: Chess, depth: number, alpha: number, beta: number, color: 1 | -1): number {
  if (game.isCheckmate()) return -MATE - depth;
  if (game.isDraw()) return 0;
  if (depth === 0) return color * evaluate(game);
  let best = -Infinity;
  for (const m of orderMoves(game.moves({ verbose: true }))) {
    game.move(m);
    const score = -negamax(game, depth - 1, -beta, -alpha, (-color) as 1 | -1);
    game.undo();
    if (score > best) best = score;
    if (score > alpha) alpha = score;
    if (alpha >= beta) break;
  }
  return best;
}

const toUci = (m: Move) => m.from + m.to + (m.promotion ?? '');

/** Einfache eigene Engine: kleine Alpha-Beta-Suche mit Material und etwas Zufall. */
export class SimpleEngine implements ChessEngine {
  readonly name = 'Einfache Engine';
  private depth: number;
  private noise: number;
  private blunderChance: number;

  constructor({ depth = 2, noise = 30, blunderChance = 0.08 }: SimpleEngineOptions = {}) {
    this.depth = depth;
    this.noise = noise;
    this.blunderChance = blunderChance;
  }

  async chooseMove(fen: string, signal?: AbortSignal): Promise<string> {
    const game = new Chess(fen);
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) throw new Error('Keine legalen Züge');
    if (signal?.aborted) throw new DOMException('Abgebrochen', 'AbortError');

    if (Math.random() < this.blunderChance) {
      return toUci(moves[Math.floor(Math.random() * moves.length)]);
    }

    const color = game.turn() === 'w' ? 1 : -1;
    let bestMove = moves[0];
    let bestScore = -Infinity;
    for (const m of orderMoves(moves)) {
      game.move(m);
      const score = -negamax(game, this.depth - 1, -Infinity, Infinity, (-color) as 1 | -1)
        + (Math.random() - 0.5) * 2 * this.noise;
      game.undo();
      if (score > bestScore) {
        bestScore = score;
        bestMove = m;
      }
    }
    return toUci(bestMove);
  }
}
