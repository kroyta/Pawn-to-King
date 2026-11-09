import { coachAnalyze, type CoachRequest } from './coachAnalysis';
import { think, type ThinkRequest } from './think';
import EngineWorker from './engine.worker?worker&inline';

export type Job =
  | { type: 'think'; request: ThinkRequest }
  | { type: 'analyze'; request: CoachRequest };

function runLocally(job: Job): unknown {
  return job.type === 'think' ? think(job.request) : coachAnalyze(job.request);
}

/**
 * Schickt Rechenaufträge an einen Web Worker, damit die Seite flüssig bleibt.
 * Ist kein Worker verfügbar, wird direkt auf der Seite gerechnet.
 */
export class WorkerClient {
  private worker: Worker | null = null;
  private failed = false;
  private nextId = 1;
  private pending = new Map<number, { job: Job; resolve: (r: any) => void; reject: (e: unknown) => void }>();

  private getWorker(): Worker | null {
    if (this.failed) return null;
    if (!this.worker) {
      try {
        this.worker = new EngineWorker();
      } catch {
        this.failed = true;
        return null;
      }
      this.worker.onerror = () => {
        this.failed = true;
        this.worker = null;
        for (const [id, p] of this.pending) {
          this.pending.delete(id);
          this.local(p.job).then(p.resolve, p.reject);
        }
      };
      this.worker.onmessage = (e: MessageEvent<{ id: number; result?: unknown; error?: string }>) => {
        const p = this.pending.get(e.data.id);
        if (!p) return;
        this.pending.delete(e.data.id);
        if (e.data.error) p.reject(new Error(e.data.error));
        else p.resolve(e.data.result);
      };
    }
    return this.worker;
  }

  private local(job: Job): Promise<any> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          resolve(runLocally(job));
        } catch (err) {
          reject(err);
        }
      }, 0);
    });
  }

  async run<T>(job: Job, signal?: AbortSignal): Promise<T> {
    const worker = this.getWorker();
    const id = this.nextId++;
    const result = worker
      ? await new Promise<T>((resolve, reject) => {
        this.pending.set(id, { job, resolve, reject });
        signal?.addEventListener('abort', () => {
          this.pending.delete(id);
          reject(new DOMException('Abgebrochen', 'AbortError'));
        });
        worker.postMessage({ id, job });
      })
      : await this.local(job);
    if (signal?.aborted) throw new DOMException('Abgebrochen', 'AbortError');
    return result as T;
  }

  dispose() {
    this.worker?.terminate();
    this.worker = null;
    for (const p of this.pending.values()) p.reject(new DOMException('Beendet', 'AbortError'));
    this.pending.clear();
  }
}
