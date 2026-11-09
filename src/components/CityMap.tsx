import { useEffect, useRef, useState } from 'react';
import { CITY_MAP, OPPONENT_MAP_SPOTS } from '../game/art';
import type { PlaceId } from '../game/places';
import { Avatar } from './Avatar';

/**
 * Stadtkarte: ein zusammenhängendes Kartenbild im Stil C (siehe docs/grafik.md).
 * Darüber liegen Tippflächen, Namensschilder, Sperren, Gegner und die eigene Figur.
 * Alle Koordinaten sind Pixel im Kartenbild (1064 × 1303).
 */
const MAP_W = 1064;
const MAP_H = 1303;
/** Maßstab für Schilder und Figuren, damit sie auf dem Handy so groß wirken wie vorher */
const UI = 2.6;

// Straßennetz: Kreuzungen und Eingänge der Orte. Die eigene Figur läuft nur auf diesen Wegen.
type NodeId = PlaceId | 'nTop' | 'nMid';
type Point = { x: number; y: number };

const NODES: Record<NodeId, Point> = {
  park: { x: 330, y: 402 },
  nTop: { x: 565, y: 410 },
  cafe: { x: 790, y: 418 },
  hall: { x: 290, y: 790 },
  nMid: { x: 542, y: 798 },
  club: { x: 775, y: 806 },
  station: { x: 528, y: 985 },
  home: { x: 516, y: 1110 },
};

const EDGES: [NodeId, NodeId][] = [
  ['park', 'nTop'], ['nTop', 'cafe'], ['nTop', 'nMid'],
  ['hall', 'nMid'], ['nMid', 'club'], ['nMid', 'station'], ['station', 'home'],
];

/** Tippfläche und Schild je Ort */
const PLACE_AREAS: Record<PlaceId, { x: number; y: number; w: number; h: number; label: Point }> = {
  park: { x: 110, y: 30, w: 470, h: 365, label: { x: 345, y: 40 } },
  cafe: { x: 600, y: 0, w: 400, h: 410, label: { x: 760, y: 40 } },
  hall: { x: 60, y: 430, w: 480, h: 350, label: { x: 300, y: 440 } },
  club: { x: 565, y: 430, w: 445, h: 370, label: { x: 790, y: 440 } },
  home: { x: 30, y: 805, w: 470, h: 365, label: { x: 265, y: 820 } },
  station: { x: 545, y: 830, w: 495, h: 380, label: { x: 790, y: 840 } },
};

function findPath(from: NodeId, to: NodeId): NodeId[] {
  const prev = new Map<NodeId, NodeId | null>([[from, null]]);
  const queue: NodeId[] = [from];
  while (queue.length) {
    const n = queue.shift()!;
    if (n === to) break;
    for (const [a, b] of EDGES) {
      const next = a === n ? b : b === n ? a : null;
      if (next && !prev.has(next)) {
        prev.set(next, n);
        queue.push(next);
      }
    }
  }
  const path: NodeId[] = [];
  for (let n: NodeId | null | undefined = to; n; n = prev.get(n)) path.unshift(n);
  return path[0] === from ? path : [to];
}

/** Geschwindigkeit der Figur in Kartenpixeln pro Sekunde */
const WALK_SPEED = 700;

export interface MapPlace {
  id: PlaceId;
  label: string;
  locked: boolean;
  /** Kurzer Zusatz an gesperrten Orten, z. B. „Ab Elo 1000“ */
  lockLabel?: string;
  /** Gegner an diesem Ort */
  opponents: { id: string; color: string }[];
}

export function CityMap({ places, location, onArrive, playerSprite }: {
  places: MapPlace[];
  /** Eigene Figur; ohne Bild läuft ein roter Bauer */
  playerSprite?: string;
  location: PlaceId;
  onArrive: (place: PlaceId) => void;
}) {
  const [pos, setPos] = useState<Point>(NODES[location]);
  const [walking, setWalking] = useState(false);
  const [facingLeft, setFacingLeft] = useState(false);
  const currentRef = useRef<PlaceId>(location);
  const frameRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
  }, []);

  const goTo = (target: PlaceId) => {
    if (walking) return;
    if (currentRef.current === target) {
      onArrive(target);
      return;
    }
    const path = findPath(currentRef.current, target).map((n) => NODES[n]);
    let seg = 0;
    let segStart = performance.now();
    setWalking(true);
    const step = (now: number) => {
      const a = path[seg];
      const b = path[seg + 1];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      const t = Math.min(1, ((now - segStart) / 1000) * WALK_SPEED / Math.max(1, len));
      if (Math.abs(b.x - a.x) > 20) setFacingLeft(b.x < a.x);
      setPos({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      if (t >= 1) {
        seg++;
        segStart = now;
        if (seg >= path.length - 1) {
          currentRef.current = target;
          setWalking(false);
          frameRef.current = null;
          onArrive(target);
          return;
        }
      }
      frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
  };

  return (
    <svg className="city-map" viewBox={`0 0 ${MAP_W} ${MAP_H}`} role="img" aria-label="Stadtkarte">
      <defs>
        {places.filter((p) => p.locked).map((p) => {
          const a = PLACE_AREAS[p.id];
          return (
            <clipPath key={p.id} id={`clip-${p.id}`}>
              <rect x={a.x} y={a.y} width={a.w} height={a.h} rx="24" />
            </clipPath>
          );
        })}
      </defs>

      <image href={CITY_MAP} x="0" y="0" width={MAP_W} height={MAP_H} />

      {/* Gesperrte Orte: dieselbe Stelle der Karte noch einmal, grau und blass */}
      {places.filter((p) => p.locked).map((p) => (
        <image
          key={p.id}
          className="map-locked"
          href={CITY_MAP}
          x="0"
          y="0"
          width={MAP_W}
          height={MAP_H}
          clipPath={`url(#clip-${p.id})`}
        />
      ))}

      {/* Gegner: mit eigener Kartenfigur an ihrem Platz, sonst als Gesicht am Eingang */}
      {places.map((p) =>
        p.opponents.map((o, i) => {
          const spot = OPPONENT_MAP_SPOTS[o.id];
          if (spot) {
            return (
              <image
                key={o.id}
                href={spot.sprite}
                x={spot.x - spot.w / 2}
                y={spot.y - spot.h}
                width={spot.w}
                height={spot.h}
                opacity={p.locked ? 0.5 : 1}
                pointerEvents="none"
              />
            );
          }
          const door = NODES[p.id];
          const x = door.x + 70 + i * 62;
          return (
            <g key={o.id} opacity={p.locked ? 0.5 : 1} pointerEvents="none">
              <ellipse cx={x} cy={door.y + 6} rx="22" ry="7" fill="#16323F" opacity="0.2" />
              <Avatar color={o.color} size={52} x={x - 26} y={door.y - 46} />
            </g>
          );
        }),
      )}

      {/* Tippflächen und Schilder */}
      {places.map((p) => (
        <PlaceArea key={p.id} p={p} onTap={goTo} />
      ))}

      {/* Eigene Figur */}
      <g transform={`translate(${pos.x} ${pos.y}) scale(${UI})`} pointerEvents="none">
        <ellipse cx="0" cy="1" rx="9" ry="3" fill="#16323F" opacity="0.25" />
        <g className={walking ? 'walker walking' : 'walker'} transform={facingLeft ? 'scale(-1 1)' : undefined}>
          {playerSprite ? (
            <image href={playerSprite} x="-11" y="-48" width="22" height="48" preserveAspectRatio="xMidYMax meet" />
          ) : (
          <path
            d="M-8 0 h16 l-2 -4 h-3 l-1.5 -9 a5.5 5.5 0 1 0 -3 0 l-1.5 9 h-3 z"
            fill="#BE4128"
            stroke="#FFFDF8"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          )}
        </g>
      </g>
    </svg>
  );
}

function PlaceArea({ p, onTap }: { p: MapPlace; onTap: (id: PlaceId) => void }) {
  const a = PLACE_AREAS[p.id];
  const extra = p.lockLabel ? ` · ${p.lockLabel}` : '';
  const width = p.label.length * 6.5 + extra.length * 5.1 + (p.locked ? 26 : 18);
  const left = -width / 2;
  return (
    <g
      className={`map-place${p.locked ? ' locked' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={p.lockLabel ? `${p.label}, ${p.lockLabel}` : p.label}
      data-place={p.id}
      onClick={() => onTap(p.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onTap(p.id);
        }
      }}
    >
      <rect className="map-hit" x={a.x} y={a.y} width={a.w} height={a.h} rx="24" />
      <g transform={`translate(${a.label.x} ${a.label.y}) scale(${UI})`}>
        <rect x={left} y="-10" width={width} height="20" rx="10" fill="#FFFDF8" stroke="#16323F" strokeWidth="1.2" />
        {p.locked && (
          <g transform={`translate(${left + 12} 0)`}>
            <rect x="-3.5" y="-1" width="7" height="5.5" rx="1" fill="#16323F" />
            <path d="M-2 -1 v-2 a2 2 0 0 1 4 0 v2" stroke="#16323F" strokeWidth="1.3" fill="none" />
          </g>
        )}
        <text x={p.locked ? left + 22 : 0} textAnchor={p.locked ? 'start' : 'middle'} dy="4" fontSize="11.5" fontWeight="700" fill="#16323F">
          {p.label}
          {extra && <tspan fontWeight="600" fill="#5C6F78" fontSize="10.5">{extra}</tspan>}
        </text>
      </g>
    </g>
  );
}
