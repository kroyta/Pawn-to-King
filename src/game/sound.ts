/**
 * Klänge, direkt im Browser erzeugt (Web Audio). Keine Sounddateien, keine Lizenzfragen.
 * Stummschalten wird nur im Browser gemerkt.
 */
export type SoundName = 'move' | 'capture' | 'check' | 'coin' | 'win' | 'loss' | 'draw' | 'tip' | 'wrong';

const MUTE_KEY = 'pawn-to-king.muted';
let ctx: AudioContext | null = null;
let muted = (() => {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
})();

export const isMuted = () => muted;

export function setMuted(value: boolean) {
  muted = value;
  try {
    localStorage.setItem(MUTE_KEY, value ? '1' : '0');
  } catch {
    // egal
  }
}

function audio(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Kurzer Ton mit weichem Ein- und Ausklang */
function tone(a: AudioContext, freq: number, start: number, dur: number, gain = 0.15, type: OscillatorType = 'sine') {
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(gain, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g).connect(a.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

/** Holziges Klacken: gefiltertes Rauschen plus tiefer Ton */
function knock(a: AudioContext, start: number, strength: number) {
  const len = Math.floor(a.sampleRate * 0.05);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  const src = a.createBufferSource();
  src.buffer = buf;
  const filter = a.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1400;
  filter.Q.value = 1.2;
  const g = a.createGain();
  g.gain.value = 0.5 * strength;
  src.connect(filter).connect(g).connect(a.destination);
  src.start(start);
  tone(a, 180, start, 0.08, 0.12 * strength, 'triangle');
}

export function play(name: SoundName) {
  if (muted) return;
  const a = audio();
  if (!a) return;
  const t = a.currentTime + 0.01;
  switch (name) {
    case 'move':
      knock(a, t, 1);
      break;
    case 'capture':
      knock(a, t, 1.4);
      knock(a, t + 0.06, 0.8);
      break;
    case 'check':
      knock(a, t, 1);
      tone(a, 660, t + 0.04, 0.18, 0.08, 'triangle');
      tone(a, 880, t + 0.12, 0.22, 0.08, 'triangle');
      break;
    case 'coin':
      tone(a, 1568, t, 0.12, 0.08);
      tone(a, 2093, t + 0.07, 0.3, 0.08);
      break;
    case 'tip':
      tone(a, 880, t, 0.15, 0.06);
      tone(a, 1175, t + 0.08, 0.2, 0.06);
      break;
    case 'win':
      [523, 659, 784, 1047].forEach((f, i) => tone(a, f, t + i * 0.11, 0.35, 0.1, 'triangle'));
      break;
    case 'loss':
      [392, 330, 262].forEach((f, i) => tone(a, f, t + i * 0.16, 0.4, 0.09, 'triangle'));
      break;
    case 'draw':
      tone(a, 523, t, 0.3, 0.08, 'triangle');
      tone(a, 523, t + 0.18, 0.35, 0.08, 'triangle');
      break;
    case 'wrong':
      tone(a, 220, t, 0.18, 0.08, 'square');
      break;
  }
}
