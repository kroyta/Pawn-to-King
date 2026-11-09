import { analyze, type RootMove } from './search';

export interface CoachRequest {
  fen: string;
  history: string[];
}

export interface CoachResult {
  /** Alle Züge, bester zuerst, Bewertung aus Sicht der Seite am Zug */
  moves: RootMove[];
  depth: number;
}

/** Bewertet eine Stellung in voller Stärke, für Tipps. */
export function coachAnalyze({ fen, history }: CoachRequest): CoachResult {
  const r = analyze(fen, { depth: 3, history, exactWindow: 400, timeLimitMs: 1500 });
  return { moves: r.moves, depth: r.depth };
}
