import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { PlaceId } from '../game/places';
import { BUILDING_ART } from '../game/art';
import { Avatar } from './Avatar';

/**
 * Stadtkarte in Papierkarten-Optik mit Gebäuden im Stil C (Spielzeugstadt, siehe docs/grafik.md).
 * Straßen und Hintergrund sind selbst gezeichnet. Keine echte Stadt, keine Wahrzeichen.
 */

// Straßennetz: Kreuzungen und Eingänge der Orte. Die eigene Figur läuft nur auf diesen Wegen.
type NodeId = PlaceId | 'nTop' | 'nMid' | 'nLow' | 'nSouth';
type Point = { x: number; y: number };

const NODES: Record<NodeId, Point> = {
  park: { x: 70, y: 150 },
  nTop: { x: 195, y: 150 },
  cafe: { x: 298, y: 150 },
  hall: { x: 95, y: 310 },
  nMid: { x: 195, y: 310 },
  club: { x: 302, y: 310 },
  home: { x: 92, y: 440 },
  nLow: { x: 195, y: 440 },
  nSouth: { x: 195, y: 578 },
  station: { x: 295, y: 578 },
};

const EDGES: [NodeId, NodeId][] = [
  ['park', 'nTop'], ['nTop', 'cafe'], ['nTop', 'nMid'],
  ['hall', 'nMid'], ['nMid', 'club'], ['nMid', 'nLow'],
  ['home', 'nLow'], ['nLow', 'nSouth'], ['nSouth', 'station'],
];

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

/** Bildfläche je Ort (unten am Eingang) und Position der Beschriftung */
const PLACE_BOXES: { id: PlaceId; box: { x: number; y: number; w: number; h: number }; label: Point }[] = [
  { id: 'park', box: { x: 8, y: 22, w: 168, h: 128 }, label: { x: 92, y: 20 } },
  { id: 'cafe', box: { x: 228, y: 14, w: 150, h: 134 }, label: { x: 300, y: 18 } },
  { id: 'hall', box: { x: 14, y: 172, w: 162, h: 134 }, label: { x: 95, y: 176 } },
  { id: 'club', box: { x: 220, y: 172, w: 160, h: 134 }, label: { x: 298, y: 176 } },
  { id: 'home', box: { x: 34, y: 322, w: 116, h: 116 }, label: { x: 92, y: 326 } },
  { id: 'station', box: { x: 212, y: 448, w: 168, h: 128 }, label: { x: 296, y: 452 } },
];

/** Geschwindigkeit der Figur in Kartenpunkten pro Sekunde */
const WALK_SPEED = 260;

export interface MapPlace {
  id: PlaceId;
  label: string;
  locked: boolean;
  /** Kurzer Zusatz unter gesperrten Orten, z. B. „Ab Elo 1000“ */
  lockLabel?: string;
  /** Gegner, die vor dem Ort stehen: Farbe und, falls vorhanden, freigestellte Figur */
  opponents: { color: string; sprite?: string }[];
}

export function CityMap({ places, location, onArrive }: {
  places: MapPlace[];
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
      if (b.x !== a.x) setFacingLeft(b.x < a.x);
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

  const place = (id: PlaceId) => places.find((p) => p.id === id)!;

  return (
    <svg className="city-map" viewBox="0 0 390 600" role="img" aria-label="Stadtkarte">
      <defs>
        <pattern id="paper" width="24" height="24" patternUnits="userSpaceOnUse">
          <rect width="24" height="24" fill="#F4EDDA" />
          <path d="M24 0 H0 V24" fill="none" stroke="#EADFC4" strokeWidth="0.6" />
        </pattern>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.6" floodColor="#16323F" floodOpacity="0.18" />
        </filter>
      </defs>

      {/* Papier */}
      <rect width="390" height="600" fill="url(#paper)" />
      <rect x="6" y="6" width="378" height="588" rx="10" fill="none" stroke="#D9CBA7" strokeWidth="1.5" strokeDasharray="5 4" />

      {/* Wiesen als ruhige Flächen zwischen den Straßen */}
      <g fill="#E3EBCF" opacity="0.7">
        <ellipse cx="300" cy="380" rx="70" ry="42" />
        <ellipse cx="95" cy="525" rx="72" ry="44" />
      </g>

      {/* Straßen */}
      <g strokeLinecap="round" fill="none">
        <g stroke="#DCCFAF" strokeWidth="17">
          <Roads />
        </g>
        <g stroke="#FFFDF8" strokeWidth="13">
          <Roads />
        </g>
      </g>

      {/* Orte: Bilder im Stil C, unten am Eingang ausgerichtet */}
      {PLACE_BOXES.map(({ id, box, label }) => (
        <PlaceGroup key={id} p={place(id)} onTap={goTo} labelAt={label}>
          <image
            className="map-image"
            href={BUILDING_ART[id]}
            x={box.x}
            y={box.y}
            width={box.w}
            height={box.h}
            preserveAspectRatio="xMidYMax meet"
          />
        </PlaceGroup>
      ))}

      {/* Gegner vor den Gebäuden */}
      {places.map((p) =>
        p.opponents.map((o, i) => {
          const door = NODES[p.id];
          const x = door.x + 20 + i * 24;
          return (
            <g key={`${p.id}-${i}`} opacity={p.locked ? 0.5 : 1} pointerEvents="none">
              <ellipse cx={x} cy={door.y + 2} rx="8" ry="2.5" fill="#16323F" opacity="0.18" />
              {o.sprite
                ? <image href={o.sprite} x={x - 9} y={door.y - 34} width="18" height="36" preserveAspectRatio="xMidYMax meet" />
                : <Avatar color={o.color} size={20} x={x - 10} y={door.y - 18} />}
            </g>
          );
        }),
      )}

      {/* Eigene Figur */}
      <g transform={`translate(${pos.x} ${pos.y})`} pointerEvents="none">
        <ellipse cx="0" cy="1" rx="9" ry="3" fill="#16323F" opacity="0.2" />
        <g className={walking ? 'walker walking' : 'walker'} transform={facingLeft ? 'scale(-1 1)' : undefined}>
          <path
            d="M-8 0 h16 l-2 -4 h-3 l-1.5 -9 a5.5 5.5 0 1 0 -3 0 l-1.5 9 h-3 z"
            fill="#BE4128"
            stroke="#FFFDF8"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </g>
      </g>
    </svg>
  );
}

function Roads() {
  return (
    <>
      <path d="M20 150 H370" />
      <path d="M195 30 V590" />
      <path d="M14 310 H376" />
      <path d="M24 440 H366" />
      <path d="M195 578 H372" />
      <path d="M298 150 V132" />
      <path d="M302 310 V298" />
      <path d="M95 310 V298" />
      <path d="M92 440 V428" />
      <path d="M295 578 V566" />
    </>
  );
}

function PlaceGroup({ p, onTap, labelAt, children }: {
  p: MapPlace;
  onTap: (id: PlaceId) => void;
  labelAt: Point;
  children: ReactNode;
}) {
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
      <g filter="url(#soft)" className="map-art">{children}</g>
      <g transform={`translate(${labelAt.x} ${labelAt.y})`}>
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



