import { Chess, type Color } from 'chess.js';

/**
 * Schneller Zugriff auf die internen Funktionen von chess.js.
 * Die öffentlichen Funktionen (move/undo) sind für eine Suche etwa 100-mal zu langsam.
 * Die internen sind nicht offiziell, deshalb ist chess.js in package.json auf eine feste Version gepinnt.
 */
export interface InternalMove {
  color: Color;
  from: number; // 0x88-Feld
  to: number;
  piece: string;
  captured?: string;
  promotion?: string;
  flags: number;
}

export interface Internals {
  _board: ({ type: string; color: Color } | undefined)[];
  _turn: Color;
  _hash: bigint;
  _moves(options: { legal: boolean }): InternalMove[];
  _makeMove(move: InternalMove): void;
  _undoMove(): void;
  _isKingAttacked(color: Color): boolean;
}

export function createPosition(fen: string): Internals {
  const g = new Chess(fen) as unknown as Internals;
  for (const fn of ['_moves', '_makeMove', '_undoMove', '_isKingAttacked'] as const) {
    if (typeof g[fn] !== 'function') {
      throw new Error(`chess.js-Interna fehlen (${fn}). Wurde die chess.js-Version geändert?`);
    }
  }
  return g;
}

export function hashOf(fen: string): bigint {
  return createPosition(fen)._hash;
}

/** 0x88-Feld → "e4" */
export function squareName(sq: number): string {
  return 'abcdefgh'[sq & 7] + (8 - (sq >> 4));
}

export function toUci(m: InternalMove): string {
  return squareName(m.from) + squareName(m.to) + (m.promotion ?? '');
}
