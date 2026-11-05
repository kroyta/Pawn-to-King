import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Chess, type Color, type Square } from 'chess.js';
import { Chessboard, defaultPieces } from 'react-chessboard';
import type { ChessEngine } from '../engine/types';
import { boardResult, timeoutResult, type GameResult } from '../game/result';
import { formatClock, type TimeControl } from '../game/timeControls';
import { t } from '../i18n/de';

const COLORS = {
  light: '#F3F0E4',
  dark: '#8AAE78',
  lastLight: '#F8E78F',
  lastDark: '#D9C95B',
};

type PromotionPiece = 'q' | 'r' | 'b' | 'n';

interface Props {
  timeControl: TimeControl;
  playerColor: Color;
  engine: ChessEngine;
  opponentName?: string;
  opponentTag?: string;
  /** Wird genau einmal aufgerufen, wenn die Partie endet */
  onFinish?: (result: GameResult) => void;
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
  timeControl, playerColor, engine, opponentName = t.opponent, opponentTag, onFinish, resultExtra,
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

  // Uhren: verbleibende Zeit je Farbe, gemessen bis zum Beginn des aktuellen Zugs.
  const remainingRef = useRef<Record<Color, number>>({ w: timeControl.initialMs ?? 0, b: timeControl.initialMs ?? 0 });
  const turnStartRef = useRef(performance.now());
  // Frühere Stellungen (FEN), damit die Engine Wiederholungen erkennt
  const historyRef = useRef<string[]>([]);
  const [now, setNow] = useState(performance.now());

  const turn = game.turn();
  const isPlayerTurn = !result && turn === playerColor;

  const finish = useCallback((res: GameResult) => {
    if (hasClock) {
      const c = gameRef.current.turn();
      remainingRef.current[c] = Math.max(0, remainingRef.current[c] - (performance.now() - turnStartRef.current));
    }
    setSelected(null);
    setPromotion(null);
    setConfirmResign(false);
    setResult(res);
  }, [hasClock]);

  const makeMove = useCallback((from: string, to: string, promo?: string): boolean => {
    const g = gameRef.current;
    const mover = g.turn();
    const before = g.fen();
    try {
      g.move({ from, to, promotion: promo });
    } catch {
      return false;
    }
    historyRef.current = [...historyRef.current, before];
    if (hasClock) {
      const t0 = performance.now();
      const left = remainingRef.current[mover] - (t0 - turnStartRef.current);
      remainingRef.current[mover] = Math.max(0, left) + timeControl.incrementMs;
      turnStartRef.current = t0;
    }
    setFen(g.fen());
    setLastMove({ from, to });
    setSelected(null);
    const res = boardResult(g);
    if (res) finish(res);
    return true;
  }, [hasClock, timeControl.incrementMs, finish]);

  // Ende der Partie genau einmal melden
  const reportedRef = useRef(false);
  useEffect(() => {
    if (result && !reportedRef.current) {
      reportedRef.current = true;
      onFinish?.(result);
    }
  }, [result, onFinish]);

  // Uhr-Ticker und Prüfung auf Zeitüberschreitung
  useEffect(() => {
    if (!hasClock || result) return;
    const id = setInterval(() => {
      const n = performance.now();
      setNow(n);
      const c = gameRef.current.turn();
      if (remainingRef.current[c] - (n - turnStartRef.current) <= 0) {
        finish(timeoutResult(gameRef.current, c));
      }
    }, 100);
    return () => clearInterval(id);
  }, [hasClock, result, finish]);

  // Computerzug
  useEffect(() => {
    if (result || gameRef.current.turn() === playerColor) return;
    const ac = new AbortController();
    const fast = (timeControl.initialMs ?? Infinity) <= 3 * 60_000;
    // Mindest-Bedenkzeit, damit der Gegner nicht unnatürlich schnell zieht. Gerechnet wird parallel.
    const minDelay = fast ? 250 + Math.random() * 700 : 600 + Math.random() * 1400;
    const botColor = gameRef.current.turn();
    const timeLeftMs = hasClock
      ? remainingRef.current[botColor] - (performance.now() - turnStartRef.current)
      : undefined;
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
  }, [fen, result, playerColor, engine, makeMove, timeControl.initialMs, hasClock]);

  const legalTargets = useMemo(
    () => (selected ? game.moves({ square: selected, verbose: true }).map((m) => m.to) : []),
    [selected, fen],
  );

  /** Versucht einen Spielerzug; öffnet bei Bauernumwandlung die Auswahl. */
  const tryPlayerMove = (from: Square, to: Square): boolean => {
    if (!isPlayerTurn) return false;
    const candidates = game.moves({ square: from, verbose: true }).filter((m) => m.to === to);
    if (candidates.length === 0) return false;
    if (candidates.some((m) => m.promotion)) {
      setPromotion({ from, to });
      setSelected(null);
      return false;
    }
    return makeMove(from, to);
  };

  const onSquareClick = ({ square, piece }: { square: string; piece: { pieceType: string } | null }) => {
    if (!isPlayerTurn) return;
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
  }, [lastMove, selected, legalTargets, fen]);

  const clockMs = (c: Color) => {
    const base = remainingRef.current[c];
    return !result && c === turn ? base - (now - turnStartRef.current) : base;
  };

  const opponentColor: Color = playerColor === 'w' ? 'b' : 'w';

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
      />

      <div className="board-wrap">
        <Chessboard
          options={{
            id: 'main-board',
            position: fen,
            boardOrientation: playerColor === 'w' ? 'white' : 'black',
            lightSquareStyle: { backgroundColor: COLORS.light },
            darkSquareStyle: { backgroundColor: COLORS.dark },
            lightSquareNotationStyle: { color: COLORS.dark, fontWeight: 700 },
            darkSquareNotationStyle: { color: COLORS.light, fontWeight: 700 },
            dropSquareStyle: { boxShadow: 'inset 0 0 0 3px rgba(22,50,63,0.35)' },
            squareStyles,
            animationDurationInMs: 180,
            allowDrawingArrows: false,
            canDragPiece: ({ piece }) => isPlayerTurn && piece.pieceType[0] === playerColor,
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
                        makeMove(promotion.from, promotion.to, p);
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
        color={playerColor}
        active={isPlayerTurn}
        clock={hasClock ? clockMs(playerColor) : null}
      />

      <div className="footer">
        <p className="status">{result ? ' ' : status}</p>
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

function PlayerBar({ name, tag, color, active, clock }: {
  name: string;
  tag?: string;
  color: Color;
  active: boolean;
  clock: number | null;
}) {
  const low = clock !== null && clock < 20_000;
  return (
    <div className="player-bar">
      <div className="player-info">
        <span className={`dot ${color === 'w' ? 'dot-white' : 'dot-black'}`} />
        <span className="player-name">{name}</span>
        {tag && <span className="player-tag">{tag}</span>}
      </div>
      {clock !== null ? (
        <span className={`clock${active ? ' active' : ''}${low ? ' low' : ''}`}>{formatClock(clock)}</span>
      ) : (
        <span className="clock off">{t.noClock}</span>
      )}
    </div>
  );
}
