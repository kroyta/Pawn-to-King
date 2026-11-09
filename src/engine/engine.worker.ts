import { coachAnalyze } from './coachAnalysis';
import { think } from './think';
import type { Job } from './workerClient';

self.onmessage = (e: MessageEvent<{ id: number; job: Job }>) => {
  const { id, job } = e.data;
  try {
    const result = job.type === 'think' ? think(job.request) : coachAnalyze(job.request);
    self.postMessage({ id, result });
  } catch (err) {
    self.postMessage({ id, error: String(err) });
  }
};
