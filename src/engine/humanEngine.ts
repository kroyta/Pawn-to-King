import { profileForElo, type StrengthProfile } from './humanPlayer';
import { think, type ThinkRequest, type ThinkResult } from './think';
import type { ChessEngine, MoveRequestOptions } from './types';
import EngineWorker from './engine.worker?worker&inline';

/**
 * Eigene Engine mit einstellbarer Stärke und menschlichen Fehlern.
 * Rechnet in einem Web Worker, damit die Seite flüssig bleibt.
 */
export class HumanEngine implements ChessEngine {
  readonly name: string;
  readonly profile: StrengthProfile;
  private worker: Worker | null = null;
  private nextId = 1;
  private pending = new Map<number, { resolve: (r: ThinkResult) => void; reject: (e: unknown) => void }>();
  /** Letzter gewählter Zug mit Art (bester Zug, natürlicher Zug, Fehler), z. B. für Reaktionen des Gegners */
  lastResult: ThinkResult | null = null;

  constructor(elo: number, name = `Stufe ${elo}`, style: Partial<Omit<StrengthProfile, 'elo' | 'depth'>> = {}) {
    this.profile = { ...profileForElo(elo), ...style };
    this.name = name;
  }

  private workerFailed = false;

  private getWorker(): Worker | null {
    if (this.workerFailed) return null;
    if (!this.worker) {
      try {
        this.worker = new EngineWorker();
      } catch {
        this.workerFailed = true;
        return null;
      }
      this.worker.onerror = () => {
        // Worker nicht verfügbar: offene Anfragen direkt auf der Seite rechnen
        this.workerFailed = true;
        this.worker = null;
        for (const [id, p] of this.pending) {
          const req = this.requests.get(id);
          if (req) this.runLocally(req).then(p.resolve, p.reject);
        }
      };
      this.worker.onmessage = (e: MessageEvent<{ id: number; result?: ThinkResult; error?: string }>) => {
        const p = this.pending.get(e.data.id);
        if (!p) return;
        this.pending.delete(e.data.id);
        this.requests.delete(e.data.id);
        if (e.data.result) p.resolve(e.data.result);
        else p.reject(new Error(e.data.error));
      };
    }
    return this.worker;
  }

  private requests = new Map<number, ThinkRequest>();

  private runLocally(request: ThinkRequest): Promise<ThinkResult> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          resolve(think(request));
        } catch (err) {
          reject(err);
        }
      }, 0);
    });
  }

  dispose() {
    this.worker?.terminate();
    this.worker = null;
    for (const p of this.pending.values()) p.reject(new DOMException('Beendet', 'AbortError'));
    this.pending.clear();
    this.requests.clear();
  }

  async chooseMove(fen: string, { signal, history = [], timeLeftMs }: MoveRequestOptions = {}): Promise<string> {
    const id = this.nextId++;
    const request: ThinkRequest = { fen, history, profile: this.profile, timeLeftMs };
    const worker = this.getWorker();
    const result = worker
      ? await new Promise<ThinkResult>((resolve, reject) => {
        this.pending.set(id, { resolve, reject });
        this.requests.set(id, request);
        signal?.addEventListener('abort', () => {
          this.pending.delete(id);
          this.requests.delete(id);
          reject(new DOMException('Abgebrochen', 'AbortError'));
        });
        worker.postMessage({ id, request });
      })
      : await this.runLocally(request);
    if (signal?.aborted) throw new DOMException('Abgebrochen', 'AbortError');
    this.lastResult = result;
    return result.uci;
  }
}
