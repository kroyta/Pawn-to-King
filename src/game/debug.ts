import { newSave, type SaveData } from './career';
import type { RatingFormat } from './rating';

/** Werkzeuge zum Testen. Nur über das versteckte Debug-Menü erreichbar. */
const DEBUG_KEY = 'pawn-to-king.debug';

export function debugEnabled(): boolean {
  try {
    if (new URLSearchParams(window.location.search).has('debug')) return true;
    return localStorage.getItem(DEBUG_KEY) === '1';
  } catch {
    return false;
  }
}

export function setDebugEnabled(on: boolean) {
  try {
    localStorage.setItem(DEBUG_KEY, on ? '1' : '0');
  } catch {
    // egal
  }
}

export const addMoney = (s: SaveData, amount: number): SaveData => ({ ...s, balance: Math.max(0, s.balance + amount) });

/** Elo in allen Formaten verschieben. Ohne bisherige Partien wird eine Schnellschach-Wertung angelegt. */
export function addElo(s: SaveData, delta: number): SaveData {
  const ratings = { ...s.ratings };
  let touched = false;
  for (const f of ['blitz', 'rapid', 'none'] as RatingFormat[]) {
    const r = ratings[f];
    if (r) {
      ratings[f] = { ...r, value: Math.max(100, r.value + delta) };
      touched = true;
    }
  }
  if (!touched) ratings.rapid = { value: Math.max(100, 800 + delta), games: 5 };
  return { ...s, ratings };
}

export const resetDaily = (s: SaveData): SaveData => ({ ...s, dailySolved: null });
export const toggleCityFinal = (s: SaveData): SaveData => ({ ...s, cityFinalWon: !s.cityFinalWon });
export const clearTournament = (s: SaveData): SaveData => ({ ...s, tournament: null });
export { placeRival } from './rival';
export const freshSave = (): SaveData => newSave();
