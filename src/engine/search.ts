import { evaluate, PIECE_VALUE } from './evaluate';
import { createPosition, hashOf, toUci, type InternalMove, type Internals } from './fastChess';

export const MATE = 100_000;
const INF = 1_000_000;
const MAX_QS_PLY = 10;

export interface RootMove {
  uci: string;
  san?: string;
  /** Echte Bewertung nach der Suche, aus Sicht des Ziehenden */
  score: number;
  /** Oberflächlicher Eindruck: Bewertung direkt nach dem Zug, ohne Antwort des Gegners */
  shallow: number;
  /** true, wenn score nur eine Obergrenze ist (Zug deutlich schlechter als der beste) */
  bound: boolean;
  capture: boolean;
  check: boolean;
}

export interface AnalyzeOptions {
  depth: number;
  /** Frühere Stellungen der Partie als FEN, für die Erkennung von Wiederholungen */
  history?: string[];
  /** Züge, die mehr als so viele Centipawns schlechter sind als der beste, werden nur grob bewertet */
  exactWindow?: number;
  /** Zeitlimit in ms. Die Suche vertieft schrittweise und nutzt die letzte fertige Tiefe. */
  timeLimitMs?: number;
}

class Timeout extends Error {}

function orderScore(m: InternalMove): number {
  let s = 0;
  if (m.captured) s += 10 * PIECE_VALUE[m.captured] - PIECE_VALUE[m.piece] + 10_000;
  if (m.promotion) s += PIECE_VALUE[m.promotion] + 9_000;
  return s;
}

function ordered(moves: InternalMove[]): InternalMove[] {
  return moves.sort((a, b) => orderScore(b) - orderScore(a));
}

class Searcher {
  nodes = 0;
  private path: bigint[] = [];
  private pos: Internals;
  private seen: Set<bigint>;
  private deadline: number;
  private killers: string[][] = [];

  constructor(pos: Internals, seen: Set<bigint>, deadline: number) {
    this.pos = pos;
    this.seen = seen;
    this.deadline = deadline;
  }

  private tick() {
    if ((++this.nodes & 1023) === 0 && performance.now() > this.deadline) throw new Timeout();
  }

  /** Bewertung aus Sicht der Seite am Zug */
  private evalSide(): number {
    const s = evaluate(this.pos);
    return this.pos._turn === 'w' ? s : -s;
  }

  private quiesce(alpha: number, beta: number, qply: number): number {
    this.tick();
    const stand = this.evalSide();
    if (stand >= beta || qply >= MAX_QS_PLY) return stand;
    if (stand > alpha) alpha = stand;
    const us = this.pos._turn;
    // Pseudolegale Schlagzüge, Legalität erst nach dem Ziehen prüfen (spart viel Zeit)
    const captures = this.pos._moves({ legal: false }).filter((m) => m.captured || m.promotion === 'q');
    for (const m of ordered(captures)) {
      this.pos._makeMove(m);
      if (this.pos._isKingAttacked(us)) {
        this.pos._undoMove();
        continue;
      }
      const score = -this.quiesce(-beta, -alpha, qply + 1);
      this.pos._undoMove();
      if (score >= beta) return score;
      if (score > alpha) alpha = score;
    }
    return alpha;
  }

  negamax(depth: number, alpha: number, beta: number, ply: number): number {
    const hash = this.pos._hash;
    if (ply > 0 && (this.seen.has(hash) || this.path.includes(hash))) return 0; // Wiederholung = Remis

    const moves = this.pos._moves({ legal: true });
    const inCheck = this.pos._isKingAttacked(this.pos._turn);
    if (moves.length === 0) return inCheck ? -(MATE - ply) : 0;
    if (inCheck && ply < 8) depth++; // Schach verlängert die Suche
    if (depth <= 0) return this.quiesce(alpha, beta, 0);

    this.tick();
    this.path.push(hash);
    let best = -INF;
    const killers = (this.killers[ply] ??= []);
    const sorted = moves
      .map((m) => ({ m, k: orderScore(m) + (killers.includes(toUci(m)) ? 5_000 : 0) }))
      .sort((a, b) => b.k - a.k);
    for (const { m } of sorted) {
      this.pos._makeMove(m);
      const score = -this.negamax(depth - 1, -beta, -alpha, ply + 1);
      this.pos._undoMove();
      if (score > best) best = score;
      if (score > alpha) alpha = score;
      if (alpha >= beta) {
        if (!m.captured) {
          const u = toUci(m);
          if (!killers.includes(u)) killers.unshift(u);
          killers.length = Math.min(killers.length, 2);
        }
        break;
      }
    }
    this.path.pop();
    return best;
  }

  /**
   * Bewertet jeden Zug der Ausgangsstellung.
   * Bei Zeitüberschreitung bricht die Suche mit Timeout ab. Die Stellung ist danach unbrauchbar,
   * deshalb wird der Searcher dann nicht weiterverwendet.
   */
  analyzeRoot(depth: number, exactWindow: number, order?: string[]): RootMove[] {
    const pos = this.pos;
    const us = pos._turn;
    const results: RootMove[] = [];
    let best = -INF;
    let moves = ordered(pos._moves({ legal: true }));
    // Beste Züge der vorigen Tiefe zuerst: engeres Fenster, schnellere Suche
    if (order) moves = moves.sort((x, y) => rank(order, toUci(x)) - rank(order, toUci(y)));
    this.path.push(pos._hash);
    for (const m of moves) {
      const alpha = best === -INF ? -INF : best - exactWindow;
      pos._makeMove(m);
      const shallowWhite = evaluate(pos);
      const check = pos._isKingAttacked(pos._turn);
      const score = -this.negamax(depth - 1, -INF, -alpha, 1);
      pos._undoMove();
      if (score > best) best = score;
      results.push({
        uci: toUci(m),
        score,
        shallow: us === 'w' ? shallowWhite : -shallowWhite,
        bound: score <= alpha,
        capture: !!m.captured,
        check,
      });
    }
    this.path.pop();
    return results.sort((x, y) => y.score - x.score);
  }

  setDeadline(deadline: number) {
    this.deadline = deadline;
  }
}

function rank(order: string[], uci: string) {
  const i = order.indexOf(uci);
  return i === -1 ? order.length : i;
}

export interface Analysis {
  moves: RootMove[];
  depth: number;
  nodes: number;
}

export function analyze(
  fen: string,
  { depth, history = [], exactWindow = 1000, timeLimitMs = Infinity }: AnalyzeOptions,
): Analysis {
  const pos = createPosition(fen);
  const seen = new Set(history.map(hashOf));
  const searcher = new Searcher(pos, seen, Infinity);
  let result: Analysis | null = null;
  // Schrittweise vertiefen. Tiefe 1 läuft immer fertig durch, danach gilt das Zeitlimit.
  for (let d = 1; d <= Math.max(1, depth); d++) {
    if (d === 2) searcher.setDeadline(performance.now() + timeLimitMs);
    try {
      const moves = searcher.analyzeRoot(d, exactWindow, result?.moves.map((m) => m.uci));
      result = { moves, depth: d, nodes: searcher.nodes };
    } catch (e) {
      if (!(e instanceof Timeout) || !result) throw e;
      break;
    }
  }
  return { ...result!, nodes: searcher.nodes };
}
