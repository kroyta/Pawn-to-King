/**
 * Austauschbare Schnittstelle für Computergegner.
 * Jede Engine (eigene Engine, später Stockfish auf dem Server, …)
 * bekommt eine Stellung als FEN und liefert einen Zug in UCI-Notation,
 * z. B. "e2e4" oder "e7e8q".
 */
export interface ChessEngine {
  readonly name: string;
  chooseMove(fen: string, signal?: AbortSignal): Promise<string>;
}
