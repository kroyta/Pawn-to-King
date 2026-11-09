import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Chess, type Color, type Square } from 'chess.js';
import { Chessboard, defaultPieces } from 'react-chessboard';
import { Coach } from '../engine/coach';
import type { ChessEngine } from '../engine/types';
import { explainBest, hintFor, MAX_TIPS_PER_GAME, TIP_KINDS, warningFor, type TipKind } from '../game/tips';
import { Portrait, type Mood } from './Avatar';
import { boardResult, timeoutResult, type GameResult } from '../game/result';
import { formatClock, type TimeControl } from '../game/timeControls';
import { formatMoney } from '../game/format';
import { play } from '../game/sound';
import { t } from '../i18n/de';

const COLORS = {
  light: '#F3F0E4',
  dark: '#8AAE78',
  lastLight: '#F8E78F',
  lastDark: '#D9C95B',
};

export interface TipOptions {
  /** Preis je Tipp in €, 0 = gratis */
  prices: Record<TipKind, number>;
  /** Bezahlt einen Tipp. false, wenn das Geld nicht reicht. */
  onBuy: (kind: TipKind, price: number) => boolean;
}

type PromotionPiece = 'q' | 'r' | 'b' | 'n';

/** Sprüche des Gegners zu bestimmten Ereignissen */
export interface ReactionLines {
  start: string[];
  botCaptures: string[];
  playerCaptures: string[];
  botChecks: string[];
  playerChecks: string[];
  botWins: string[];
  botLoses: string[];
  draw: string[];
}

export interface Persona {
  color: string;
  /** Freigestellte Figur je Gesichtsausdruck, falls vorhanden */
  sprites?: Record<Mood, string>;
  lines: ReactionLines;
}

type ReactionEvent = keyof ReactionLines;

const MOOD_FOR: Record<ReactionEvent, Mood> = {
  start: 'neutral',
  botCaptures: 'happy',
  playerCaptures: 'worried',
  botChecks: 'happy',
  playerChecks: 'worried',
  botWins: 'happy',
  botLoses: 'worried',
  draw: 'neutral',
};

/** Wie oft der Gegner etwas sagt (Ende und Start immer) */
const CHATTINESS: Record<ReactionEvent, number> = {
  start: 1, botCaptures: 0.6, playerCaptures: 0.7, botChecks: 0.5, playerChecks: 0.4, botWins: 1, botLoses: 1, draw: 1,
};

const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

interface Props {
  timeControl: TimeControl;
  playerColor: Color;
  engine: ChessEngine;
  opponentName?: string;
  opponentTag?: string;
  playerTag?: string;
  /** Aussehen und Sprüche des Gegners; ohne Persona gibt es keine Sprechblase */
  persona?: Persona;
  /** Wird genau einmal aufgerufen, wenn die Partie endet */
  onFinish?: (result: GameResult, info: { tipsUsed: number }) => void;
  /** Tipps gegen Spielgeld; ohne diese Angabe gibt es keine Tipps (z. B. im Turnier) */
  tips?: TipOptions;
  /** Farben der Brettfelder (gekaufter Brett-Stil) */
  boardColors?: { light: string; dark: string };
  /** Zusätzlicher Inhalt im Ergebnisfenster, z. B. Gewinn oder Verlust */
  resultExtra?: ReactNode;
  /** Beschriftung der Revanche; null blendet sie aus */
  rematchLabel?: string | null;
  newGameLabel?: string;
  onRematch: () => void;
  onNewGame: () => void;
}

const isLightSquare = (sq: string) => (sq.charCodeAt(0) - 97 + Number(sq[1]) - 1) % 2 === 1;

export function GameScreen({
  timeControl, playerColor, engine, opponentName = t.opponent, opponentTag, playerTag, persona, onFinish, tips, boardColors, resultExtra,
  rematchLabel = t.actions.rematch, newGameLabel = t.actions.newGame, onRematch, onNewGame,
}: Props) {
  const gameRef = useRef(new Chess());
  const game = gameRef.current;
  const hasClock = timeControl.initialMs !== null;

  const [fen, setFen] = useState(game.fen());
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [selected, setSelected] = useState<Square | null>(null);
  const [promotion, setPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [confirmResign, setConfirmResign] = useState(false);
  const light = boardColors?.light ?? COLORS.light;
  const dark = boardColors?.dark ?? COLORS.dark;

  // Tipps
  const [tipsUsed, setTipsUsed] = useState(0);
  const [tipBusy, setTipBusy] = useState(false);
  const [warningArmed, setWarningArmed] = useState(false);
  const [tipText, setTipText] = useState<string | null>(null);
  const [hintSquare, setHintSquare] = useState<string | null>(null);
  const [arrow, setArrow] = useState<{ from: string; to: string } | null>(null);
  const [warnPending, setWarnPending] = useState<{ from: string; to: string; promo?: string; text: string } | null>(null);
  const coachRef = useRef<Coach | null>(null);
  const coach = () => (coachRef.current ??= new Coach());
  useEffect(() => () => coachRef.current?.dispose(), []);

  // Uhren: verbleibende Zeit je Farbe, gemessen bis zum Beginn des aktuellen Zugs.
  const remainingRef = useRef<Record<Color, number>>({ w: timeControl.initialMs ?? 0, b: timeControl.initialMs ?? 0 });
  const turnStartRef = useRef(performance.now());
  // Frühere Stellungen (FEN), damit die Engine Wiederholungen erkennt
  const historyRef = useRef<string[]>([]);
  const [now, setNow] = useState(performance.now());

  const turn = game.turn();
  const isPlayerTurn = !result && turn === playerColor;
  const opponentColor: Color = playerColor === 'w' ? 'b' : 'w';

  /** Verbrauchte Zeit im laufenden Zug. Die Uhr des Gegners läuft um botClockFactor schneller ab. */
  const elapsed = useCallback(
    (c: Color, at: number) => (at - turnStartRef.current) * (c === opponentColor ? timeControl.botClockFactor : 1),
    [opponentColor, timeControl.botClockFactor],
  );

  // Sprechblase und Gesichtsausdruck
  const [bubble, setBubble] = useState<{ text: string; id: number } | null>(null);
  const [mood, setMood] = useState<Mood>('neutral');
  const say = useCallback((event: ReactionEvent) => {
    if (!persona) return;
    setMood(MOOD_FOR[event]);
    if (Math.random() > CHATTINESS[event]) return;
    setBubble({ text: pick(persona.lines[event]), id: Date.now() });
  }, [persona]);

  useEffect(() => {
    if (!bubble || result) return;
    const id = setTimeout(() => setBubble(null), 5000);
    return () => clearTimeout(id);
  }, [bubble, result]);

  // Begrüßung
  useEffect(() => { say('start'); }, [say]);

  const finish = useCallback((res: GameResult) => {
    if (hasClock) {
      const c = gameRef.current.turn();
      remainingRef.current[c] = Math.max(0, remainingRef.current[c] - elapsed(c, performance.now()));
    }
    setSelected(null);
    setPromotion(null);
    setConfirmResign(false);
    setResult(res);
  }, [hasClock, elapsed]);

  const makeMove = useCallback((from: string, to: string, promo?: string): boolean => {
    const g = gameRef.current;
    const mover = g.turn();
    const before = g.fen();
    let move;
    try {
      move = g.move({ from, to, promotion: promo });
    } catch {
      return false;
    }
    historyRef.current = [...historyRef.current, before];
    if (hasClock) {
      const t0 = performance.now();
      const left = remainingRef.current[mover] - elapsed(mover, t0);
      remainingRef.current[mover] = Math.max(0, left) + timeControl.incrementMs;
      turnStartRef.current = t0;
    }
    setFen(g.fen());
    setLastMove({ from, to });
    setSelected(null);
    setHintSquare(null);
    setArrow(null);
    if (mover !== opponentColor) setTipText(null);
    play(g.inCheck() ? 'check' : move.captured ? 'capture' : 'move');
    const res = boardResult(g);
    if (res) {
      finish(res);
    } else {
      const byBot = mover === opponentColor;
      const bigCapture = move.captured && move.captured !== 'p';
      if (g.inCheck()) say(byBot ? 'botChecks' : 'playerChecks');
      else if (bigCapture) say(byBot ? 'botCaptures' : 'playerCaptures');
    }
    return true;
  }, [hasClock, timeControl.incrementMs, finish, elapsed, opponentColor, say]);

  // Ende der Partie genau einmal melden
  const reportedRef = useRef(false);
  useEffect(() => {
    if (result && !reportedRef.current) {
      reportedRef.current = true;
      onFinish?.(result, { tipsUsed });
      setTimeout(() => play(result.winner === null ? 'draw' : result.winner === playerColor ? 'win' : 'loss'), 250);
      say(result.winner === null ? 'draw' : result.winner === playerColor ? 'botLoses' : 'botWins');
    }
  }, [result, onFinish, say, playerColor, tipsUsed]);

  // Uhr-Ticker und Prüfung auf Zeitüberschreitung
  useEffect(() => {
    if (!hasClock || result) return;
    const id = setInterval(() => {
      const n = performance.now();
      setNow(n);
      const c = gameRef.current.turn();
      if (remainingRef.current[c] - elapsed(c, n) <= 0) {
        finish(timeoutResult(gameRef.current, c));
      }
    }, 100);
    return () => clearInterval(id);
  }, [hasClock, result, finish, elapsed]);

  // Computerzug
  useEffect(() => {
    if (result || gameRef.current.turn() === playerColor) return;
    const ac = new AbortController();
    const botColor = gameRef.current.turn();
    // Restzeit in echter Zeit (die Gegneruhr läuft schneller ab)
    const timeLeftMs = hasClock
      ? (remainingRef.current[botColor] - elapsed(botColor, performance.now())) / timeControl.botClockFactor
      : undefined;
    // Bedenkzeit wie ein Mensch: in der Eröffnung schnell, in Zeitnot kürzer. Gerechnet wird parallel.
    const [lo, hi] = timeControl.botThinkMs;
    let minDelay = lo + Math.random() * (hi - lo);
    if (historyRef.current.length < 8) minDelay *= 0.4;
    if (timeLeftMs !== undefined) minDelay = Math.min(minDelay, timeLeftMs / 30);
    minDelay = Math.max(150, minDelay);
    const wait = new Promise((resolve) => setTimeout(resolve, minDelay));
    Promise.all([
      engine.chooseMove(gameRef.current.fen(), { signal: ac.signal, history: historyRef.current, timeLeftMs }),
      wait,
    ])
      .then(([uci]) => {
        if (ac.signal.aborted) return;
        makeMove(uci.slice(0, 2), uci.slice(2, 4), uci[4]);
      })
      .catch(() => { /* abgebrochen */ });
    return () => ac.abort();
  }, [fen, result, playerColor, engine, makeMove, timeControl, hasClock, elapsed]);

  const legalTargets = useMemo(
    () => (selected ? game.moves({ square: selected, verbose: true }).map((m) => m.to) : []),
    [selected, fen],
  );

  const canInput = isPlayerTurn && !tipBusy && !warnPending;

  /** Führt den Zug aus. Ist die Warnung aktiv, prüft der Trainer ihn vorher. */
  const commitPlayerMove = (from: string, to: string, promo?: string): boolean => {
    if (!warningArmed) return makeMove(from, to, promo);
    setWarningArmed(false);
    setTipBusy(true);
    setTipText(t.tips.thinking);
    coach().analyze(gameRef.current.fen(), historyRef.current)
      .then((analysis) => {
        const warning = warningFor(analysis, from + to + (promo ?? ''));
        if (warning) {
          setTipText(null);
          play('wrong');
          setWarnPending({ from, to, promo, text: warning });
        } else {
          setTipText(t.tips.safe);
          makeMove(from, to, promo);
        }
      })
      .catch(() => makeMove(from, to, promo))
      .finally(() => setTipBusy(false));
    return false;
  };

  /** Versucht einen Spielerzug; öffnet bei Bauernumwandlung die Auswahl. */
  const tryPlayerMove = (from: Square, to: Square): boolean => {
    if (!canInput) return false;
    const candidates = game.moves({ square: from, verbose: true }).filter((m) => m.to === to);
    if (candidates.length === 0) return false;
    if (candidates.some((m) => m.promotion)) {
      setPromotion({ from, to });
      setSelected(null);
      return false;
    }
    return commitPlayerMove(from, to);
  };

  // Wie viele eigene Züge schon gespielt sind (für die Rettung)
  const plies = game.history().length;
  const ownMoves = playerColor === 'w' ? Math.ceil(plies / 2) : Math.floor(plies / 2);

  const buyTip = (kind: TipKind) => {
    if (!tips || !canInput || tipsUsed >= MAX_TIPS_PER_GAME) return;
    if (!tips.onBuy(kind, tips.prices[kind])) {
      setTipText(t.tips.notEnough);
      return;
    }
    setTipsUsed((n) => n + 1);
    play('tip');
    const g = gameRef.current;
    if (kind === 'warning') {
      setWarningArmed(true);
      setTipText(t.tips.armed);
      return;
    }
    if (kind === 'undo') {
      g.undo();
      g.undo();
      historyRef.current = historyRef.current.slice(0, -2);
      const last = g.history({ verbose: true }).at(-1);
      setLastMove(last ? { from: last.from, to: last.to } : null);
      setFen(g.fen());
      setHintSquare(null);
      setArrow(null);
      setTipText(t.tips.undone);
      return;
    }
    const fenNow = g.fen();
    setTipBusy(true);
    setTipText(t.tips.thinking);
    coach().analyze(fenNow, historyRef.current)
      .then((analysis) => {
        if (gameRef.current.fen() !== fenNow) return;
        if (kind === 'hint') {
          const h = hintFor(fenNow, analysis);
          setHintSquare(h.square);
          setTipText(h.text);
        } else {
          const b = explainBest(fenNow, analysis);
          setArrow({ from: b.from, to: b.to });
          setTipText(b.text);
        }
      })
      .catch(() => setTipText(null))
      .finally(() => setTipBusy(false));
  };

  const tipDisabled = (kind: TipKind) =>
    !canInput || tipsUsed >= MAX_TIPS_PER_GAME
    || (kind === 'warning' && warningArmed)
    || (kind === 'undo' && ownMoves < 1);

  const onSquareClick = ({ square, piece }: { square: string; piece: { pieceType: string } | null }) => {
    if (!canInput) return;
    const sq = square as Square;
    if (selected && legalTargets.includes(sq)) {
      tryPlayerMove(selected, sq);
      return;
    }
    if (piece && piece.pieceType[0] === playerColor && sq !== selected) setSelected(sq);
    else setSelected(null);
  };

  // Feldmarkierungen: letzter Zug, Auswahl, Zielfelder, Schach
  const squareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};
    const mark = (sq: string) => {
      styles[sq] = { backgroundColor: isLightSquare(sq) ? COLORS.lastLight : COLORS.lastDark };
    };
    if (lastMove) {
      mark(lastMove.from);
      mark(lastMove.to);
    }
    if (selected) mark(selected);
    if (hintSquare) {
      styles[hintSquare] = { ...styles[hintSquare], boxShadow: 'inset 0 0 0 4px #2F8A9C' };
    }
    for (const sq of legalTargets) {
      const occupied = !!game.get(sq);
      styles[sq] = {
        ...styles[sq],
        backgroundImage: occupied
          ? 'radial-gradient(circle, transparent 62%, rgba(22,50,63,0.28) 63%)'
          : 'radial-gradient(circle, rgba(22,50,63,0.24) 22%, transparent 23%)',
      };
    }
    if (game.inCheck()) {
      const king = game.findPiece({ type: 'k', color: game.turn() })[0];
      if (king) {
        styles[king] = {
          ...styles[king],
          backgroundImage: 'radial-gradient(circle, rgba(190,65,40,0.85) 0%, rgba(190,65,40,0.35) 45%, transparent 70%)',
        };
      }
    }
    return styles;
  }, [lastMove, selected, legalTargets, fen, hintSquare]);

  const clockMs = (c: Color) => {
    const base = remainingRef.current[c];
    return !result && c === turn ? base - elapsed(c, now) : base;
  };

  let status: string = isPlayerTurn ? t.status.yourTurn : t.status.thinking;
  if (!result && game.inCheck()) status = `${t.status.check} ${status}`;

  return (
    <div className="game">
      <PlayerBar
        name={opponentName}
        tag={opponentTag ?? engine.name}
        color={opponentColor}
        active={!result && turn === opponentColor}
        clock={hasClock ? clockMs(opponentColor) : null}
        avatar={persona && <Portrait color={persona.color} sprites={persona.sprites} mood={!result && turn === opponentColor && mood === 'neutral' ? 'thinking' : mood} size={40} />}
        bubble={bubble}
      />

      <div className="board-wrap">
        <Chessboard
          options={{
            id: 'main-board',
            position: fen,
            boardOrientation: playerColor === 'w' ? 'white' : 'black',
            lightSquareStyle: { backgroundColor: light },
            darkSquareStyle: { backgroundColor: dark },
            lightSquareNotationStyle: { color: dark, fontWeight: 700 },
            darkSquareNotationStyle: { color: light, fontWeight: 700 },
            arrows: arrow ? [{ startSquare: arrow.from, endSquare: arrow.to, color: '#2F8A9C' }] : [],
            dropSquareStyle: { boxShadow: 'inset 0 0 0 3px rgba(22,50,63,0.35)' },
            squareStyles,
            animationDurationInMs: 180,
            allowDrawingArrows: false,
            canDragPiece: ({ piece }) => canInput && piece.pieceType[0] === playerColor,
            onPieceDrag: ({ square }) => {
              if (square) setSelected(square as Square);
            },
            onPieceDrop: ({ sourceSquare, targetSquare }) => {
              if (!targetSquare || sourceSquare === targetSquare) return false;
              return tryPlayerMove(sourceSquare as Square, targetSquare as Square);
            },
            onSquareClick,
          }}
        />

        {promotion && (
          <div className="overlay" onClick={() => setPromotion(null)}>
            <div className="card promo" onClick={(e) => e.stopPropagation()}>
              <p className="card-label">{t.promotion}</p>
              <div className="promo-row">
                {(['q', 'r', 'b', 'n'] as PromotionPiece[]).map((p) => {
                  const Piece = defaultPieces[`${playerColor}${p.toUpperCase()}`];
                  return (
                    <button
                      key={p}
                      className="promo-btn"
                      onClick={() => {
                        commitPlayerMove(promotion.from, promotion.to, p);
                        setPromotion(null);
                      }}
                    >
                      <Piece />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {warnPending && (
          <div className="overlay">
            <div className="card warn">
              <p className="warn-title">{t.tips.warnTitle}</p>
              <p className="warn-text">{warnPending.text}</p>
              <div className="btn-row">
                <button className="btn primary" onClick={() => setWarnPending(null)}>{t.tips.chooseOther}</button>
                <button
                  className="btn"
                  onClick={() => {
                    const w = warnPending;
                    setWarnPending(null);
                    makeMove(w.from, w.to, w.promo);
                  }}
                >
                  {t.tips.playAnyway}
                </button>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="overlay">
            <div className="card result">
              <p className={`result-title ${result.winner === null ? 'draw' : result.winner === playerColor ? 'win' : 'loss'}`}>
                {result.winner === null ? t.result.draw : result.winner === playerColor ? t.result.win : t.result.loss}
              </p>
              <p className="result-reason">{t.reason[result.reason]}</p>
              {resultExtra}
              <div className="btn-row">
                {rematchLabel && <button className="btn primary" onClick={onRematch}>{rematchLabel}</button>}
                <button className={`btn${rematchLabel ? '' : ' primary'}`} onClick={onNewGame}>{newGameLabel}</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <PlayerBar
        name={t.you}
        tag={playerTag}
        color={playerColor}
        active={isPlayerTurn}
        clock={hasClock ? clockMs(playerColor) : null}
      />

      {tips && !result && (
        <div className="tips">
          <div className="tips-head">
            <span>{t.tips.title}</span>
            <span>{t.tips.left(MAX_TIPS_PER_GAME - tipsUsed)}</span>
          </div>
          <div className="tip-row">
            {TIP_KINDS.map((kind) => (
              <button key={kind} className={`tip tip-${kind}`} disabled={tipDisabled(kind)} onClick={() => buyTip(kind)}>
                <TipIcon kind={kind} />
                <span className="tip-name">{t.tips.names[kind]}</span>
                <span className="tip-price">{tips.prices[kind] === 0 ? t.tips.free : formatMoney(tips.prices[kind])}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="footer">
        {tipText && !result
          ? <p className="tip-text">{tipText}</p>
          : <p className="status">{result ? '\u00a0' : status}</p>}
        {!result && (
          confirmResign ? (
            <div className="btn-row">
              <span className="confirm-text">{t.actions.confirmResign}</span>
              <button className="btn danger small" onClick={() => finish({ winner: opponentColor, reason: 'resignation' })}>
                {t.actions.yes}
              </button>
              <button className="btn small" onClick={() => setConfirmResign(false)}>{t.actions.no}</button>
            </div>
          ) : (
            <button className="btn ghost small" onClick={() => setConfirmResign(true)}>{t.actions.resign}</button>
          )
        )}
      </div>
    </div>
  );
}

function TipIcon({ kind }: { kind: TipKind }) {
  const common = {
    width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', strokeWidth: 2.2,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true,
  };
  switch (kind) {
    case 'warning':
      return <svg {...common} stroke="#E9A81C"><path d="M12 3 L22 20 H2 Z" /><path d="M12 10 v4 M12 17 v.5" /></svg>;
    case 'hint':
      return (
        <svg {...common} stroke="#2F8A9C">
          <path d="M9 18 h6 M10 21 h4" />
          <path d="M12 3 a6 6 0 0 1 3.5 10.9 c-.6 .5 -1 1.2 -1 2.1 h-5 c0 -.9 -.4 -1.6 -1 -2.1 A6 6 0 0 1 12 3 Z" />
        </svg>
      );
    case 'best':
      return <svg {...common} stroke="#5E8A4E"><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4" /></svg>;
    case 'undo':
      return <svg {...common} stroke="#BE4128"><path d="M9 7 H4 V2" /><path d="M4.5 7 A8.5 8.5 0 1 1 3.5 13" /></svg>;
  }
}

function PlayerBar({ name, tag, color, active, clock, avatar, bubble }: {
  name: string;
  tag?: string;
  color: Color;
  active: boolean;
  clock: number | null;
  avatar?: ReactNode;
  bubble?: { text: string; id: number } | null;
}) {
  const low = clock !== null && clock < 20_000;
  return (
    <div className={`player-bar${avatar ? ' with-avatar' : ''}`}>
      <div className="player-info">
        {avatar}
        <div className="player-text">
          <div className="player-line">
            <span className={`dot ${color === 'w' ? 'dot-white' : 'dot-black'}`} />
            <span className="player-name">{name}</span>
            {tag && <span className="player-tag">{tag}</span>}
          </div>
          {avatar && (
            <p key={bubble?.id ?? 'none'} className={`speech${bubble ? ' show' : ''}`}><span>{bubble?.text ?? '\u00a0'}</span></p>
          )}
        </div>
      </div>
      {clock !== null ? (
        <span className={`clock${active ? ' active' : ''}${low ? ' low' : ''}`}>{formatClock(clock)}</span>
      ) : (
        <span className="clock off">{t.noClock}</span>
      )}
    </div>
  );
}
