import type { CoachResult } from './coachAnalysis';
import { WorkerClient } from './workerClient';

/** Trainer für Tipps: bewertet Stellungen in voller Stärke, im eigenen Worker. */
export class Coach {
  private client = new WorkerClient();

  analyze(fen: string, history: string[], signal?: AbortSignal): Promise<CoachResult> {
    return this.client.run<CoachResult>({ type: 'analyze', request: { fen, history } }, signal);
  }

  dispose() {
    this.client.dispose();
  }
}
