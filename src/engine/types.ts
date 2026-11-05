/**
 * Austauschbare Schnittstelle für Computergegner.
 * Jede Engine (eigene Engine, später Stockfish auf dem Server, …)
 * bekommt eine Stellung als FEN und liefert einen Zug in UCI-Notation,
 * z. B. "e2e4" oder "e7e8q".
 */
export interface ChessEngine {
  readonly name: string;
  chooseMove(fen: string, options?: MoveRequestOptions): Promise<string>;
}

export interface MoveRequestOptions {
  signal?: AbortSignal;
  /** Frühere Stellungen der Partie als FEN, damit die Engine Wiederholungen erkennt */
  history?: string[];
  /** Restzeit der Engine auf der Uhr in ms, falls mit Uhr gespielt wird */
  timeLeftMs?: number;
}
