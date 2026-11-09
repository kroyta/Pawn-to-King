export type Mood = 'neutral' | 'happy' | 'worried' | 'thinking';

/**
 * Platzhalter-Gesicht für Gegner mit wenigen Ausdrücken.
 * Wird später durch die gezeichneten Vektorfiguren ersetzt.
 */
export function Avatar({ color, mood = 'neutral', size = 48, x, y }: {
  color: string;
  mood?: Mood;
  size?: number;
  /** Position, wenn das Gesicht in einer anderen SVG-Grafik steht */
  x?: number;
  y?: number;
}) {
  const mouth = {
    neutral: 'M24 44 Q32 46 40 44',
    happy: 'M22 41 Q32 52 42 41',
    worried: 'M23 47 Q32 40 41 47',
    thinking: 'M26 45 L38 43',
  }[mood];
  const pupilDx = mood === 'thinking' ? 2 : 0;
  const pupilDy = mood === 'thinking' ? -2 : 0;
  return (
    <svg className={`avatar-svg mood-${mood}`} x={x} y={y} width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <circle cx="32" cy="32" r="31" fill={color} />
      <circle cx="32" cy="34" r="22" fill="#FFF3E2" />
      {mood === 'worried' && (
        <g stroke="#16323F" strokeWidth="2.5" strokeLinecap="round">
          <path d="M19 24 L27 27" />
          <path d="M45 24 L37 27" />
        </g>
      )}
      {mood === 'happy' ? (
        <g stroke="#16323F" strokeWidth="2.8" fill="none" strokeLinecap="round">
          <path d="M20 32 Q24 28 28 32" />
          <path d="M36 32 Q40 28 44 32" />
        </g>
      ) : (
        <g fill="#16323F">
          <circle cx={24 + pupilDx} cy={32 + pupilDy} r="3" />
          <circle cx={40 + pupilDx} cy={32 + pupilDy} r="3" />
        </g>
      )}
      <path d={mouth} stroke="#16323F" strokeWidth="2.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Porträt eines Gegners: Kopf der freigestellten Figur, wenn es eine gibt, sonst das Platzhalter-Gesicht.
 */
export function Portrait({ color, sprites, mood = 'neutral', size = 48 }: {
  color: string;
  sprites?: Record<Mood, string>;
  mood?: Mood;
  size?: number;
}) {
  if (!sprites) return <Avatar color={color} mood={mood} size={size} />;
  return (
    <span className="portrait" style={{ width: size, height: size, background: color }} aria-hidden>
      <img src={sprites[mood]} alt="" draggable={false} />
    </span>
  );
}
