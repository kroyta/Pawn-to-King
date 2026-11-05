import { think, type ThinkRequest } from './think';

self.onmessage = (e: MessageEvent<{ id: number; request: ThinkRequest }>) => {
  const { id, request } = e.data;
  try {
    self.postMessage({ id, result: think(request) });
  } catch (err) {
    self.postMessage({ id, error: String(err) });
  }
};
