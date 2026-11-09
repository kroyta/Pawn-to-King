/**
 * Tagesaufgaben: selbst erstellte Matt-in-1-Stellungen (keine fremde Datenbank, keine Lizenzfrage).
 * Jede Lösung, die mattsetzt, zählt.
 */
export const PUZZLES: string[] = [
  '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1',
  '7k/Q7/6K1/8/8/8/8/8 w - - 0 1',
  '6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1',
  '1r4k1/8/8/8/8/8/5PPP/6K1 b - - 0 1',
  'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
  'rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2',
  'k7/1R6/2K5/8/8/8/8/7R w - - 0 1',
  '7k/7p/5N2/8/8/8/8/6RK w - - 0 1',
  '6k1/5ppp/8/8/8/2q5/5PPP/6K1 b - - 0 1',
];

/** Belohnung für die gelöste Tagesaufgabe */
export const DAILY_REWARD = 15;

export const todayKey = (date = new Date()) => date.toISOString().slice(0, 10);

/** Jeden Tag eine andere Aufgabe */
export function puzzleOfDay(date = new Date()): string {
  const day = Math.floor(date.getTime() / 86_400_000);
  return PUZZLES[day % PUZZLES.length];
}
