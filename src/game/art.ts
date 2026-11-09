import cafe from '../assets/city/cafe.webp';
import club from '../assets/city/club.webp';
import hall from '../assets/city/hall.webp';
import home from '../assets/city/home.webp';
import cityMap from '../assets/city/map.webp';
import park from '../assets/city/park.webp';
import station from '../assets/city/station.webp';
import heinzHappy from '../assets/opponents/heinz-happy.webp';
import heinzNeutral from '../assets/opponents/heinz-neutral.webp';
import heinzSitting from '../assets/opponents/heinz-sitting.webp';
import heinzThinking from '../assets/opponents/heinz-thinking.webp';
import heinzWorried from '../assets/opponents/heinz-worried.webp';
import type { Mood } from '../components/Avatar';
import type { PlaceId } from './places';

/** Gebäude der Stadtkarte (Stil C, erzeugt mit Canva, siehe docs/grafik.md) */
export const BUILDING_ART: Record<PlaceId, string> = { cafe, club, hall, home, park, station };

/** Freigestellte Gegnerfiguren je Gesichtsausdruck. Gegner ohne Eintrag zeigen das Platzhalter-Gesicht. */
export const OPPONENT_ART: Record<string, Record<Mood, string>> = {
  heinz: { neutral: heinzNeutral, happy: heinzHappy, worried: heinzWorried, thinking: heinzThinking },
};

/** Zusammenhängendes Kartenbild der ersten Stadt (1064 × 1303) */
export const CITY_MAP = cityMap;

/** Gegner, die mit eigener Figur an einem festen Platz auf der Karte sitzen (Kartenpixel, unten Mitte) */
export const OPPONENT_MAP_SPOTS: Record<string, { sprite: string; x: number; y: number; w: number; h: number }> = {
  heinz: { sprite: heinzSitting, x: 262, y: 352, w: 130, h: 167 },
};
