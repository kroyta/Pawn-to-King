import { MATE, type RootMove } from './search';

/**
 * Wie ein Gegner denkt und patzt. Alle Werte hängen von der Spielstärke ab.
 */
export interface StrengthProfile {
  /** Ungefähre Spielstärke, nur intern */
  elo: number;
  /** Suchtiefe in Halbzügen */
  depth: number;
  /** Wie gleichgültig die Wahl zwischen ähnlich guten Zügen ist (Centipawns). Höher = schwächer. */
  temperature: number;
  /** Wahrscheinlichkeit pro Zug für einen echten Fehler */
  blunderChance: number;
  /** Wie groß ein Fehler höchstens sein darf (Centipawns) */
  maxBlunder: number;
  /** Vorliebe für Schlagzüge und Schachgebote (Centipawns Bonus) */
  greed: number;
}

// Stützpunkte, dazwischen wird interpoliert. Startwerte für die Tests.
const ANCHORS: StrengthProfile[] = [
  { elo: 400, depth: 1, temperature: 140, blunderChance: 0.3, maxBlunder: 900, greed: 60 },
  { elo: 800, depth: 2, temperature: 80, blunderChance: 0.16, maxBlunder: 600, greed: 35 },
  { elo: 1200, depth: 2, temperature: 45, blunderChance: 0.08, maxBlunder: 350, greed: 15 },
  { elo: 1600, depth: 3, temperature: 22, blunderChance: 0.035, maxBlunder: 220, greed: 5 },
  { elo: 2000, depth: 3, temperature: 8, blunderChance: 0.01, maxBlunder: 120, greed: 0 },
];

export function profileForElo(elo: number): StrengthProfile {
  if (elo <= ANCHORS[0].elo) return { ...ANCHORS[0], elo };
  const last = ANCHORS[ANCHORS.length - 1];
  if (elo >= last.elo) return { ...last, elo };
  const i = ANCHORS.findIndex((a) => a.elo > elo);
  const lo = ANCHORS[i - 1];
  const hi = ANCHORS[i];
  const t = (elo - lo.elo) / (hi.elo - lo.elo);
  const mix = (a: number, b: number) => a + (b - a) * t;
  return {
    elo,
    depth: t < 0.5 ? lo.depth : hi.depth,
    temperature: mix(lo.temperature, hi.temperature),
    blunderChance: mix(lo.blunderChance, hi.blunderChance),
    maxBlunder: mix(lo.maxBlunder, hi.maxBlunder),
    greed: mix(lo.greed, hi.greed),
  };
}

export type MoveKind = 'best' | 'natural' | 'blunder';

export interface Choice {
  move: RootMove;
  kind: MoveKind;
  /** Wie viel schlechter als der beste Zug (Centipawns) */
  loss: number;
}

/**
 * Wählt einen Zug wie ein Mensch dieser Stärke:
 * - Meist ein guter Zug, aber nicht immer der beste (gewichteter Zufall).
 * - Manchmal ein Fehler, der auf den ersten Blick gut aussieht: Er verliert erst nach der Antwort des Gegners Material.
 *   Völlig sinnlose Züge, die sofort etwas einstellen, spielt der Gegner nicht.
 */
export function chooseHumanMove(moves: RootMove[], profile: StrengthProfile, rng: () => number = Math.random): Choice {
  const best = moves[0];
  const bestScore = best.score;
  const lossOf = (m: RootMove) => bestScore - m.score;

  // Ein gefundenes Matt spielt auch ein schwacher Gegner meistens.
  const mateFound = bestScore > MATE - 100;

  if (!mateFound && rng() < profile.blunderChance) {
    const plausible = moves.filter((m) => {
      const loss = lossOf(m);
      return !m.bound && loss >= 80 && loss <= profile.maxBlunder && m.shallow >= bestScore - 40;
    });
    if (plausible.length > 0) {
      // Je verlockender der Zug aussieht, desto eher wird er gespielt.
      const pick = weightedPick(plausible, (m) => Math.exp((m.shallow - bestScore) / 60), rng);
      return { move: pick, kind: 'blunder', loss: lossOf(pick) };
    }
  }

  const candidates = moves.filter((m) => !m.bound && lossOf(m) <= profile.temperature * 6);
  const pick = weightedPick(
    candidates,
    (m) => {
      const bonus = (m.capture || m.check ? profile.greed : 0);
      return Math.exp((m.score - bestScore + bonus) / Math.max(1, profile.temperature));
    },
    rng,
  );
  return { move: pick, kind: pick === best ? 'best' : 'natural', loss: lossOf(pick) };
}

function weightedPick<T>(items: T[], weight: (x: T) => number, rng: () => number): T {
  const ws = items.map(weight);
  const total = ws.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= ws[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}
