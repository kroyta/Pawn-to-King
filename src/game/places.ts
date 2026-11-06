/** Orte auf der Stadtkarte. Gegner gibt es in Park, Café und Club. */
export type PlaceId = 'park' | 'cafe' | 'club' | 'hall' | 'home' | 'station';

export const ALL_PLACES: PlaceId[] = ['home', 'park', 'cafe', 'club', 'hall', 'station'];

/** Startort der eigenen Figur */
export const START_PLACE: PlaceId = 'home';
