import { chooseHumanMove, type MoveKind, type StrengthProfile } from './humanPlayer';
import { analyze } from './search';

export interface ThinkRequest {
  fen: string;
  history: string[];
  profile: StrengthProfile;
  timeLeftMs?: number;
}

export interface ThinkResult {
  uci: string;
  kind: MoveKind;
  loss: number;
  depth: number;
  nodes: number;
}

/** Sucht und wählt einen Zug. Läuft im Web Worker, lässt sich aber auch direkt aufrufen (Tests). */
export function think({ fen, history, profile, timeLeftMs }: ThinkRequest): ThinkResult {
  // Nie mehr als 1,5 s und nie mehr als etwa 1/40 der Restzeit rechnen
  const timeLimitMs = Math.max(150, Math.min(1500, timeLeftMs !== undefined ? timeLeftMs / 40 : 1500));
  const exactWindow = Math.max(profile.maxBlunder, profile.temperature * 6) + 50;
  const analysis = analyze(fen, { depth: profile.depth, history, exactWindow, timeLimitMs });
  const choice = chooseHumanMove(analysis.moves, profile);
  return { uci: choice.move.uci, kind: choice.kind, loss: choice.loss, depth: analysis.depth, nodes: analysis.nodes };
}
