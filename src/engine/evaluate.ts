import type { Internals } from './fastChess';

export const PIECE_VALUE: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

// Stellungstabellen nach der „Simplified Evaluation Function“ (Tomasz Michniewski).
// Aus Sicht von Weiß, erste Zeile = 8. Reihe.
const PST: Record<string, number[]> = {
  p: [
    0, 0, 0, 0, 0, 0, 0, 0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
    5, 5, 10, 25, 25, 10, 5, 5,
    0, 0, 0, 20, 20, 0, 0, 0,
    5, -5, -10, 0, 0, -10, -5, 5,
    5, 10, 10, -20, -20, 10, 10, 5,
    0, 0, 0, 0, 0, 0, 0, 0,
  ],
  n: [
    -50, -40, -30, -30, -30, -30, -40, -50,
    -40, -20, 0, 0, 0, 0, -20, -40,
    -30, 0, 10, 15, 15, 10, 0, -30,
    -30, 5, 15, 20, 20, 15, 5, -30,
    -30, 0, 15, 20, 20, 15, 0, -30,
    -30, 5, 10, 15, 15, 10, 5, -30,
    -40, -20, 0, 5, 5, 0, -20, -40,
    -50, -40, -30, -30, -30, -30, -40, -50,
  ],
  b: [
    -20, -10, -10, -10, -10, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 5, 10, 10, 5, 0, -10,
    -10, 5, 5, 10, 10, 5, 5, -10,
    -10, 0, 10, 10, 10, 10, 0, -10,
    -10, 10, 10, 10, 10, 10, 10, -10,
    -10, 5, 0, 0, 0, 0, 5, -10,
    -20, -10, -10, -10, -10, -10, -10, -20,
  ],
  r: [
    0, 0, 0, 0, 0, 0, 0, 0,
    5, 10, 10, 10, 10, 10, 10, 5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    0, 0, 0, 5, 5, 0, 0, 0,
  ],
  q: [
    -20, -10, -10, -5, -5, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 5, 5, 5, 5, 0, -10,
    -5, 0, 5, 5, 5, 5, 0, -5,
    0, 0, 5, 5, 5, 5, 0, -5,
    -10, 5, 5, 5, 5, 5, 0, -10,
    -10, 0, 5, 0, 0, 0, 0, -10,
    -20, -10, -10, -5, -5, -10, -10, -20,
  ],
  k: [
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -20, -30, -30, -40, -40, -30, -30, -20,
    -10, -20, -20, -20, -20, -20, -20, -10,
    20, 20, 0, 0, 0, 0, 20, 20,
    20, 30, 10, 0, 0, 10, 30, 20,
  ],
};

const KING_ENDGAME = [
  -50, -40, -30, -20, -20, -30, -40, -50,
  -30, -20, -10, 0, 0, -10, -20, -30,
  -30, -10, 20, 30, 30, 20, -10, -30,
  -30, -10, 30, 40, 40, 30, -10, -30,
  -30, -10, 30, 40, 40, 30, -10, -30,
  -30, -10, 20, 30, 30, 20, -10, -30,
  -30, -30, 0, 0, 0, 0, -30, -30,
  -50, -30, -30, -30, -30, -30, -30, -50,
];

/** Bewertung in Centipawns aus Sicht von Weiß. */
export function evaluate(pos: Internals): number {
  const board = pos._board;
  let score = 0;
  let nonPawn = 0; // Material ohne Bauern und Könige, beide Seiten
  const material = { w: 0, b: 0 };
  const bishops = { w: 0, b: 0 };
  const king = { w: 0, b: 0 };
  let positional = 0;

  for (let sq = 0; sq < 128; sq++) {
    if (sq & 0x88) { sq += 7; continue; }
    const p = board[sq];
    if (!p) continue;
    const r = sq >> 4;
    const f = sq & 7;
    const idx = p.color === 'w' ? r * 8 + f : (7 - r) * 8 + f;
    const sign = p.color === 'w' ? 1 : -1;
    if (p.type === 'k') {
      king[p.color] = sq;
      continue;
    }
    material[p.color] += PIECE_VALUE[p.type];
    if (p.type !== 'p') nonPawn += PIECE_VALUE[p.type];
    if (p.type === 'b') bishops[p.color]++;
    positional += sign * PST[p.type][idx];
  }

  score = material.w - material.b + positional;
  if (bishops.w >= 2) score += 30;
  if (bishops.b >= 2) score -= 30;

  // Könige: im Mittelspiel in Deckung, im Endspiel ins Zentrum
  const endgame = nonPawn <= 1300;
  for (const c of ['w', 'b'] as const) {
    const sq = king[c];
    const r = sq >> 4;
    const f = sq & 7;
    const idx = c === 'w' ? r * 8 + f : (7 - r) * 8 + f;
    score += (c === 'w' ? 1 : -1) * (endgame ? KING_ENDGAME[idx] : PST.k[idx]);
  }

  // Mattführung: Bei klarem Vorteil den gegnerischen König an den Rand drängen
  const diff = material.w - material.b;
  if (endgame && Math.abs(diff) >= 400) {
    const strong = diff > 0 ? 'w' : 'b';
    const weak = strong === 'w' ? 'b' : 'w';
    const wr = king[weak] >> 4, wf = king[weak] & 7;
    const sr = king[strong] >> 4, sf = king[strong] & 7;
    const edge = Math.max(3 - wr, wr - 4) + Math.max(3 - wf, wf - 4);
    const dist = Math.abs(wr - sr) + Math.abs(wf - sf);
    score += (strong === 'w' ? 1 : -1) * (edge * 10 + (14 - dist) * 4);
  }
  return score;
}
