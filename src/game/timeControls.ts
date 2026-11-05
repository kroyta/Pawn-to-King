export interface TimeControl {
  id: string;
  label: string;
  /** null = ohne Uhr */
  initialMs: number | null;
  incrementMs: number;
  /**
   * Wie viel schneller die Uhr des Gegners abläuft. Der Gegner wartet in echter Zeit kürzer,
   * seine Uhr verliert aber die volle gespielte Denkzeit. Startwerte für die Tests.
   */
  botClockFactor: number;
  /** Echte Wartezeit des Gegners pro Zug in ms (min, max) */
  botThinkMs: [number, number];
}

export const TIME_CONTROLS: TimeControl[] = [
  { id: '3+0', label: '3 Min.', initialMs: 3 * 60_000, incrementMs: 0, botClockFactor: 1, botThinkMs: [300, 2200] },
  { id: '3+2', label: '3 + 2', initialMs: 3 * 60_000, incrementMs: 2_000, botClockFactor: 1, botThinkMs: [400, 3000] },
  { id: '10+0', label: '10 Min.', initialMs: 10 * 60_000, incrementMs: 0, botClockFactor: 3, botThinkMs: [700, 3500] },
  { id: '15+10', label: '15 + 10', initialMs: 15 * 60_000, incrementMs: 10_000, botClockFactor: 5, botThinkMs: [900, 4000] },
  { id: 'none', label: 'Ohne Uhr', initialMs: null, incrementMs: 0, botClockFactor: 1, botThinkMs: [2000, 5000] },
];

export function formatClock(ms: number): string {
  const clamped = Math.max(0, ms);
  if (clamped < 10_000) {
    // Unter 10 Sekunden mit Zehntelsekunden
    return `0:0${(Math.floor(clamped / 100) / 10).toFixed(1)}`;
  }
  const total = Math.ceil(clamped / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
