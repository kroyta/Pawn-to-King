import { newSave, type SaveData } from './wallet';

const KEY = 'pawn-to-king.save.v1';

/** Lädt den Spielstand aus dem Browser. Fehlt er oder ist er kaputt, gibt es einen neuen. */
export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return newSave();
    const data = JSON.parse(raw) as SaveData;
    if (data?.version !== 1 || typeof data.balance !== 'number') return newSave();
    return data;
  } catch {
    return newSave();
  }
}

export function storeSave(save: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    // Speichern nicht möglich (z. B. privater Modus): Das Spiel läuft trotzdem weiter.
  }
}
