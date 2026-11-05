import type { TimeControl } from './timeControls';
import { TIME_CONTROLS } from './timeControls';

export interface Opponent {
  id: string;
  /** Verborgene Spielstärke */
  elo: number;
  /** Fester, sichtbarer Einsatz in € */
  stake: number;
  timeControl: TimeControl;
  /** Initialen als Platzhalter für die spätere Vektorfigur */
  initials: string;
}

const tc = (id: string) => TIME_CONTROLS.find((x) => x.id === id)!;

// Erster Gegner im Park. Texte (Name, Ort, Spruch) stehen in i18n unter opponents.<id>.
export const OPPONENTS: Opponent[] = [
  { id: 'heinz', elo: 700, stake: 20, timeControl: tc('10+0'), initials: 'HS' },
];
