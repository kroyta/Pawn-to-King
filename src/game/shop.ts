/** Dinge zum Kaufen. Preise sind Startwerte für die Tests. */
export interface ShopItem {
  id: string;
  price: number;
}

/** Einrichtung für die Wohnung: zeigt den Aufstieg, bringt kein Geld */
export const FURNITURE: ShopItem[] = [
  { id: 'plant', price: 30 },
  { id: 'poster', price: 60 },
  { id: 'woodBoard', price: 150 },
  { id: 'sofa', price: 300 },
  { id: 'bookshelf', price: 500 },
];

export interface BoardTheme extends ShopItem {
  light: string;
  dark: string;
}

/** Brett-Stile. Der letzte Zug bleibt immer gelb markiert, damit das Brett klar lesbar bleibt. */
export const BOARD_THEMES: BoardTheme[] = [
  { id: 'classic', price: 0, light: '#F3F0E4', dark: '#8AAE78' },
  { id: 'walnut', price: 250, light: '#F0DEC2', dark: '#B58863' },
  { id: 'slate', price: 250, light: '#E8EDEF', dark: '#7F98A6' },
];

export function themeById(id: string): BoardTheme {
  return BOARD_THEMES.find((t) => t.id === id) ?? BOARD_THEMES[0];
}

/** Dossier über einen Gegner: Anteil am Einsatz, mindestens 10 € */
export function dossierPrice(stake: number): number {
  return Math.max(10, Math.round(stake * 0.25));
}
