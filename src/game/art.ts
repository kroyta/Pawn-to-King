import cafe from '../assets/city/cafe.webp';
import club from '../assets/city/club.webp';
import hall from '../assets/city/hall.webp';
import home from '../assets/city/home.webp';
import cityMap from '../assets/city/map.webp';
import park from '../assets/city/park.webp';
import station from '../assets/city/station.webp';
import albrechtHappy from '../assets/opponents/albrecht-happy.webp';
import albrechtMap from '../assets/opponents/albrecht-map.webp';
import albrechtNeutral from '../assets/opponents/albrecht-neutral.webp';
import albrechtThinking from '../assets/opponents/albrecht-thinking.webp';
import albrechtWorried from '../assets/opponents/albrecht-worried.webp';
import heinzHappy from '../assets/opponents/heinz-happy.webp';
import heinzNeutral from '../assets/opponents/heinz-neutral.webp';
import heinzSitting from '../assets/opponents/heinz-sitting.webp';
import heinzThinking from '../assets/opponents/heinz-thinking.webp';
import heinzWorried from '../assets/opponents/heinz-worried.webp';
import jojoHappy from '../assets/opponents/jojo-happy.webp';
import jojoMap from '../assets/opponents/jojo-map.webp';
import jojoNeutral from '../assets/opponents/jojo-neutral.webp';
import jojoThinking from '../assets/opponents/jojo-thinking.webp';
import jojoWorried from '../assets/opponents/jojo-worried.webp';
import kevinHappy from '../assets/opponents/kevin-happy.webp';
import kevinMap from '../assets/opponents/kevin-map.webp';
import kevinNeutral from '../assets/opponents/kevin-neutral.webp';
import kevinThinking from '../assets/opponents/kevin-thinking.webp';
import kevinWorried from '../assets/opponents/kevin-worried.webp';
import marleneHappy from '../assets/opponents/marlene-happy.webp';
import marleneMap from '../assets/opponents/marlene-map.webp';
import marleneNeutral from '../assets/opponents/marlene-neutral.webp';
import marleneThinking from '../assets/opponents/marlene-thinking.webp';
import marleneWorried from '../assets/opponents/marlene-worried.webp';
import type { Mood } from '../components/Avatar';
import type { PlaceId } from './places';

/** Gebäude der Stadtkarte (Stil C, erzeugt mit Canva, siehe docs/grafik.md) */
export const BUILDING_ART: Record<PlaceId, string> = { cafe, club, hall, home, park, station };

/** Freigestellte Gegnerfiguren je Gesichtsausdruck. Gegner ohne Eintrag zeigen das Platzhalter-Gesicht. */
export const OPPONENT_ART: Record<string, Record<Mood, string>> = {
  heinz: { neutral: heinzNeutral, happy: heinzHappy, worried: heinzWorried, thinking: heinzThinking },
  jojo: { neutral: jojoNeutral, happy: jojoHappy, worried: jojoWorried, thinking: jojoThinking },
  marlene: { neutral: marleneNeutral, happy: marleneHappy, worried: marleneWorried, thinking: marleneThinking },
  kevin: { neutral: kevinNeutral, happy: kevinHappy, worried: kevinWorried, thinking: kevinThinking },
  albrecht: { neutral: albrechtNeutral, happy: albrechtHappy, worried: albrechtWorried, thinking: albrechtThinking },
};

/** Zusammenhängendes Kartenbild der ersten Stadt (1064 × 1303) */
export const CITY_MAP = cityMap;

/** Gegner, die mit eigener Figur an einem festen Platz auf der Karte sitzen (Kartenpixel, unten Mitte) */
export const OPPONENT_MAP_SPOTS: Record<string, { sprite: string; x: number; y: number; w: number; h: number }> = {
  heinz: { sprite: heinzSitting, x: 262, y: 352, w: 130, h: 167 },
  jojo: { sprite: jojoMap, x: 505, y: 350, w: 73, h: 125 },
  marlene: { sprite: marleneMap, x: 672, y: 385, w: 66, h: 130 },
  kevin: { sprite: kevinMap, x: 880, y: 402, w: 46, h: 125 },
  albrecht: { sprite: albrechtMap, x: 700, y: 790, w: 46, h: 125 },
};
