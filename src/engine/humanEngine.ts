import { profileForElo, type StrengthProfile } from './humanPlayer';
import type { ThinkResult } from './think';
import type { ChessEngine, MoveRequestOptions } from './types';
import { WorkerClient } from './workerClient';

/**
 * Eigene Engine mit einstellbarer Stärke und menschlichen Fehlern.
 * Rechnet in einem Web Worker, damit die Seite flüssig bleibt.
 */
export class HumanEngine implements ChessEngine {
  readonly name: string;
  readonly profile: StrengthProfile;
  private client = new WorkerClient();
  /** Letzter gewählter Zug mit Art (bester Zug, natürlicher Zug, Fehler), z. B. für Reaktionen des Gegners */
  lastResult: ThinkResult | null = null;

  constructor(elo: number, name = `Stufe ${elo}`, style: Partial<Omit<StrengthProfile, 'elo' | 'depth'>> = {}) {
    this.profile = { ...profileForElo(elo), ...style };
    this.name = name;
  }

  dispose() {
    this.client.dispose();
  }

  async chooseMove(fen: string, { signal, history = [], timeLeftMs }: MoveRequestOptions = {}): Promise<string> {
    const result = await this.client.run<ThinkResult>(
      { type: 'think', request: { fen, history, profile: this.profile, timeLeftMs } },
      signal,
    );
    this.lastResult = result;
    return result.uci;
  }
}
