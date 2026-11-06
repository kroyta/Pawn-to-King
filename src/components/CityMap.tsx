import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { PlaceId } from '../game/places';
import { Avatar } from './Avatar';

/**
 * Selbst gezeichnete Stadtkarte in Papierkarten-Optik.
 * Platzhalter, bis es eine illustrierte Karte gibt. Keine echte Stadt, keine Wahrzeichen.
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

/** Geschwindigkeit der Figur in Kartenpunkten pro Sekunde */
const WALK_SPEED = 260;

export interface MapPlace {
  id: PlaceId;
  label: string;
  locked: boolean;
  /** Kurzer Zusatz unter gesperrten Orten, z. B. „Ab Elo 1000“ */
  lockLabel?: string;
  /** Farben der Gegner, die vor dem Ort stehen */
  opponents: string[];
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

      {/* Fluss */}
      <path d="M-10 492 C 100 468, 260 520, 400 484" fill="none" stroke="#A9CDD1" strokeWidth="34" />
      <path d="M-10 492 C 100 468, 260 520, 400 484" fill="none" stroke="#C9E1E3" strokeWidth="26" />
      <path d="M40 486 q 10 -4 20 0 M300 500 q 10 -4 20 0 M120 478 q 10 -4 20 0" stroke="#FFFDF8" strokeWidth="1.5" fill="none" opacity="0.8" />

      {/* Straßen */}
      <g strokeLinecap="round" fill="none">
        <g stroke="#DCCFAF" strokeWidth="17">
          <Roads />
        </g>
        <g stroke="#FFFDF8" strokeWidth="13">
          <Roads />
        </g>
      </g>

      {/* Brücke */}
      <g>
        <rect x="183" y="468" width="24" height="44" fill="#FFFDF8" />
        <path d="M183 468 V512 M207 468 V512" stroke="#5C6F78" strokeWidth="2.5" />
      </g>

      {/* Deko: Bäume und kleine Häuser */}
      <Tree x={236} y={180} r={8} />
      <Tree x={364} y={262} r={8} />
      <Tree x={170} y={382} r={8} />
      <Tree x={150} y={545} r={9} />
      <SmallHouse x={222} y={360} roof="#C9B994" />
      <SmallHouse x={268} y={372} roof="#D8A36A" />
      <SmallHouse x={318} y={358} roof="#C9B994" />
      <Compass x={46} y={556} />

      {/* Orte */}
      <PlaceGroup p={place('park')} onTap={goTo} labelAt={{ x: 92, y: 30 }}>
        <rect x="20" y="40" width="150" height="96" rx="18" fill="#DCE8C9" stroke="#B9CF9E" strokeWidth="1.5" />
        <path d="M36 128 C 70 100, 110 120, 150 70" stroke="#EFE4C7" strokeWidth="6" fill="none" strokeLinecap="round" />
        <Tree x={44} y={64} r={12} />
        <Tree x={74} y={56} r={10} />
        <Tree x={150} y={110} r={11} />
        <Tree x={136} y={56} r={9} />
        {/* Schachtisch */}
        <rect x="92" y="84" width="22" height="22" rx="3" fill="#FFFDF8" stroke="#16323F" strokeWidth="1.5" />
        <path d="M92 95 H114 M103 84 V106" stroke="#8AAE78" strokeWidth="11" strokeDasharray="0" opacity="0.55" />
        <rect x="92" y="84" width="22" height="22" rx="3" fill="none" stroke="#16323F" strokeWidth="1.5" />
      </PlaceGroup>

      <PlaceGroup p={place('cafe')} onTap={goTo} labelAt={{ x: 296, y: 46 }}>
        <rect x="248" y="60" width="98" height="72" rx="4" fill="#FBF6EA" stroke="#C9B994" strokeWidth="1.5" />
        <path d="M244 60 L350 60 L346 50 L248 50 Z" fill="#BE4128" />
        <path d="M250 72 h96" stroke="#BE4128" strokeWidth="10" strokeDasharray="12 8" />
        <rect x="258" y="88" width="22" height="20" rx="2" fill="#C9E1E3" stroke="#5C6F78" />
        <rect x="314" y="88" width="22" height="20" rx="2" fill="#C9E1E3" stroke="#5C6F78" />
        <rect x="287" y="100" width="20" height="32" rx="2" fill="#7A5C3E" />
        <circle cx="297" cy="88" r="6" fill="#FFFDF8" stroke="#16323F" strokeWidth="1.2" />
        <path d="M294 88 h6 M297 85 v6" stroke="#16323F" strokeWidth="1.2" />
      </PlaceGroup>

      <PlaceGroup p={place('club')} onTap={goTo} labelAt={{ x: 290, y: 206 }}>
        <rect x="252" y="236" width="102" height="62" fill="#FBF6EA" stroke="#C9B994" strokeWidth="1.5" />
        <path d="M246 236 L303 214 L360 236 Z" fill="#2F8A9C" />
        <g fill="#E7DDC4">
          <rect x="262" y="246" width="8" height="46" />
          <rect x="282" y="246" width="8" height="46" />
          <rect x="316" y="246" width="8" height="46" />
          <rect x="336" y="246" width="8" height="46" />
        </g>
        <rect x="294" y="262" width="18" height="36" rx="9" fill="#16323F" />
        {/* Turm-Symbol */}
        <path d="M297 222 v-5 h3 v3 h3 v-3 h3 v3 h3 v-3 h3 v5 l-2 3 v6 h-11 v-6 z" fill="#FFFDF8" transform="translate(-6 0)" />
      </PlaceGroup>

      <PlaceGroup p={place('hall')} onTap={goTo} labelAt={{ x: 95, y: 196 }}>
        <rect x="28" y="226" width="134" height="72" rx="4" fill="#FBF6EA" stroke="#C9B994" strokeWidth="1.5" />
        <path d="M24 228 Q95 186 166 228 Z" fill="#E9A81C" />
        <g fill="#C9E1E3" stroke="#5C6F78">
          <rect x="40" y="244" width="18" height="24" rx="9" />
          <rect x="66" y="244" width="18" height="24" rx="9" />
          <rect x="106" y="244" width="18" height="24" rx="9" />
          <rect x="132" y="244" width="18" height="24" rx="9" />
        </g>
        <rect x="86" y="262" width="18" height="36" rx="2" fill="#7A5C3E" />
        <path d="M95 202 v-12" stroke="#16323F" strokeWidth="1.5" />
        <path d="M95 190 l10 3 l-10 3 z" fill="#BE4128" />
      </PlaceGroup>

      <PlaceGroup p={place('home')} onTap={goTo} labelAt={{ x: 92, y: 336 }}>
        <rect x="56" y="370" width="74" height="58" fill="#FBF6EA" stroke="#C9B994" strokeWidth="1.5" />
        <path d="M48 372 L93 342 L138 372 Z" fill="#8AAE78" />
        <rect x="66" y="384" width="18" height="16" rx="2" fill="#F8E78F" stroke="#5C6F78" />
        <rect x="104" y="384" width="18" height="16" rx="2" fill="#C9E1E3" stroke="#5C6F78" />
        <rect x="84" y="402" width="16" height="26" rx="2" fill="#BE4128" />
      </PlaceGroup>

      <PlaceGroup p={place('station')} onTap={goTo} labelAt={{ x: 292, y: 516 }}>
        <rect x="228" y="528" width="132" height="38" rx="3" fill="#FBF6EA" stroke="#C9B994" strokeWidth="1.5" />
        <path d="M222 530 H366 L356 518 H232 Z" fill="#5C6F78" />
        <circle cx="294" cy="540" r="7" fill="#FFFDF8" stroke="#16323F" strokeWidth="1.2" />
        <path d="M294 536 v4 l3 2" stroke="#16323F" strokeWidth="1.2" fill="none" />
        <g fill="#C9E1E3" stroke="#5C6F78">
          <rect x="240" y="540" width="16" height="16" rx="2" />
          <rect x="262" y="540" width="16" height="16" rx="2" />
          <rect x="312" y="540" width="16" height="16" rx="2" />
          <rect x="334" y="540" width="16" height="16" rx="2" />
        </g>
      </PlaceGroup>

      {/* Gegner vor den Gebäuden */}
      {places.map((p) =>
        p.opponents.map((color, i) => {
          const door = NODES[p.id];
          return (
            <g key={`${p.id}-${i}`} opacity={p.locked ? 0.5 : 1} pointerEvents="none">
              <ellipse cx={door.x + 26 + i * 22} cy={door.y - 2} rx="8" ry="2.5" fill="#16323F" opacity="0.15" />
              <Avatar color={color} size={20} x={door.x + 16 + i * 22} y={door.y - 20} />
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

function Tree({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g>
      <circle cx={x + 1.5} cy={y + 2} r={r} fill="#6F9660" opacity="0.5" />
      <circle cx={x} cy={y} r={r} fill="#8AAE78" />
      <circle cx={x - r / 3} cy={y - r / 3} r={r / 3} fill="#A3C291" />
    </g>
  );
}

function SmallHouse({ x, y, roof }: { x: number; y: number; roof: string }) {
  return (
    <g opacity="0.85">
      <rect x={x} y={y + 10} width="34" height="26" fill="#FBF6EA" stroke="#D9CBA7" />
      <path d={`M${x - 4} ${y + 11} L${x + 17} ${y - 2} L${x + 38} ${y + 11} Z`} fill={roof} />
      <rect x={x + 13} y={y + 22} width="8" height="14" fill="#D9CBA7" />
    </g>
  );
}

function Compass({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} opacity="0.7">
      <circle r="13" fill="none" stroke="#C9B994" strokeWidth="1.2" />
      <path d="M0 -11 L4 0 L0 11 L-4 0 Z" fill="#C9B994" />
      <path d="M0 -11 L4 0 L-4 0 Z" fill="#BE4128" />
      <text y="-15" textAnchor="middle" fontSize="8" fontWeight="700" fill="#5C6F78">N</text>
    </g>
  );
}
