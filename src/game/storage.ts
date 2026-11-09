import { emptyRatings } from './rating';
import { newSave, type SaveData } from './career';

const KEY = 'pawn-to-king.save.v1';

/** Älteren Spielstand auf die aktuelle Version bringen. */
function migrate(data: any): SaveData | null {
  if (data?.version === 3) return { player: null, ...data } as SaveData;
  if (data?.version === 2) {
    // Version 3 bringt Tagesaufgabe, Einkäufe, Dossiers und Turnier
    const fresh = newSave();
    return {
      ...data,
      version: 3,
      dailySolved: fresh.dailySolved,
      owned: fresh.owned,
      boardTheme: fresh.boardTheme,
      dossiers: fresh.dossiers,
      tournament: fresh.tournament,
      cityFinalWon: fresh.cityFinalWon,
      player: null,
    } as SaveData;
  }
  if (data?.version === 1 && typeof data.balance === 'number') {
    // Version 1 kannte noch keine Elo. Eine offene Partie wird ohne Elo-Wertung als verloren gebucht.
    return {
      ...newSave(),
      balance: data.balance,
      stats: data.stats ?? newSave().stats,
      ratings: emptyRatings(),
      activeMatch: null,
    };
  }
  return null;
}

/** Lädt den Spielstand aus dem Browser. Fehlt er oder ist er kaputt, gibt es einen neuen. */
export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return newSave();
    return migrate(JSON.parse(raw)) ?? newSave();
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
