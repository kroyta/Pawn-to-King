import { useMemo, useState } from 'react';
import { Chess, type Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { formatMoney } from '../game/format';
import { DAILY_REWARD } from '../game/puzzles';
import { t } from '../i18n/de';

/** Tagesaufgabe: Matt in 1. Jede Lösung, die mattsetzt, zählt. */
export function PuzzleScreen({ fen, alreadySolved, colors, onSolved, onBack }: {
  fen: string;
  alreadySolved: boolean;
  colors: { light: string; dark: string };
  onSolved: () => void;
  onBack: () => void;
}) {
  const game = useMemo(() => new Chess(fen), [fen]);
  const [position, setPosition] = useState(fen);
  const [selected, setSelected] = useState<Square | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [done, setDone] = useState(false);
  const white = game.turn() === 'w';

  const tryMove = (from: Square, to: Square): boolean => {
    if (done) return false;
    const g = new Chess(fen);
    try {
      g.move({ from, to, promotion: 'q' });
    } catch {
      return false;
    }
    setSelected(null);
    if (g.isCheckmate()) {
      setPosition(g.fen());
      setDone(true);
      setMessage({ text: alreadySolved ? t.daily.rightAgain : t.daily.right(formatMoney(DAILY_REWARD)), ok: true });
      if (!alreadySolved) onSolved();
      return true;
    }
    // Falscher Zug: kurz zeigen, dann zurück
    setPosition(g.fen());
    setMessage({ text: t.daily.wrong, ok: false });
    setTimeout(() => setPosition(fen), 700);
    return true;
  };

  const targets = selected ? game.moves({ square: selected, verbose: true }).map((m) => m.to) : [];
  const styles: Record<string, React.CSSProperties> = {};
  if (selected) styles[selected] = { backgroundColor: '#F8E78F' };
  for (const sq of targets) styles[sq] = { backgroundImage: 'radial-gradient(circle, rgba(22,50,63,0.24) 22%, transparent 23%)' };

  return (
    <section className="puzzle">
      <h2>{t.daily.title}</h2>
      <p className="puzzle-task">{t.daily.task(white)}</p>
      <div className="puzzle-board">
        <Chessboard
          options={{
            id: 'puzzle-board',
            position,
            boardOrientation: white ? 'white' : 'black',
            lightSquareStyle: { backgroundColor: colors.light },
            darkSquareStyle: { backgroundColor: colors.dark },
            lightSquareNotationStyle: { color: colors.dark, fontWeight: 700 },
            darkSquareNotationStyle: { color: colors.light, fontWeight: 700 },
            squareStyles: styles,
            allowDrawingArrows: false,
            canDragPiece: ({ piece }) => !done && piece.pieceType[0] === game.turn(),
            onPieceDrop: ({ sourceSquare, targetSquare }) =>
              !!targetSquare && tryMove(sourceSquare as Square, targetSquare as Square),
            onSquareClick: ({ square, piece }) => {
              if (done) return;
              const sq = square as Square;
              if (selected && targets.includes(sq)) tryMove(selected, sq);
              else if (piece && piece.pieceType[0] === game.turn()) setSelected(sq);
              else setSelected(null);
            },
          }}
        />
      </div>
      {message && <p className={`puzzle-msg ${message.ok ? 'ok' : 'no'}`}>{message.text}</p>}
      <button className={`btn ${done ? 'primary' : 'ghost'} big`} onClick={onBack}>{t.daily.back}</button>
    </section>
  );
}
