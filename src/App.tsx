import { useCallback, useEffect, useState } from 'react';
import type { Color } from 'chess.js';
import { GameScreen } from './components/GameScreen';
import { HomeScreen } from './components/HomeScreen';
import { TestSetup, type TestSettings } from './components/TestSetup';
import { HumanEngine } from './engine/humanEngine';
import { formatMoney } from './game/format';
import { OPPONENTS, type Opponent } from './game/opponents';
import type { GameResult } from './game/result';
import { loadSave, storeSave } from './game/storage';
import type { TimeControl } from './game/timeControls';
import {
  canAfford, newSave, outcomeFor, resolveAbandoned, settleMatch, startMatch,
  type SaveData, type Settlement,
} from './game/wallet';
import { t } from './i18n/de';

interface Match {
  id: number;
  timeControl: TimeControl;
  playerColor: Color;
  engine: HumanEngine;
  /** null = freie Testpartie ohne Geld */
  opponent: Opponent | null;
  free: boolean;
}

type Screen = 'home' | 'test';

const randomColor = (): Color => (Math.random() < 0.5 ? 'w' : 'b');

/** Beim Start laden und eine abgebrochene Partie als Niederlage verbuchen. */
function initialState(): { save: SaveData; notice: string | null } {
  const loaded = loadSave();
  const abandoned = resolveAbandoned(loaded);
  if (!abandoned) return { save: loaded, notice: null };
  return {
    save: abandoned.save,
    notice: abandoned.lost > 0 ? t.money.abandoned(formatMoney(abandoned.lost)) : null,
  };
}

export default function App() {
  const [{ save: initialSave, notice: initialNotice }] = useState(initialState);
  const [save, setSave] = useState<SaveData>(initialSave);
  const [notice, setNotice] = useState<string | null>(initialNotice);
  const [screen, setScreen] = useState<Screen>('home');
  const [match, setMatch] = useState<Match | null>(null);
  const [settlement, setSettlement] = useState<Settlement | null>(null);

  // Jede Änderung sofort speichern
  useEffect(() => storeSave(save), [save]);

  // Den Rechen-Thread des alten Gegners beenden, wenn ein neuer kommt
  const engine = match?.engine;
  useEffect(() => () => engine?.dispose(), [engine]);

  const playOpponent = (opponent: Opponent, free: boolean, reuse?: HumanEngine) => {
    // Einsatz wird beim Start einbehalten
    setSave(startMatch(save, opponent.id, opponent.stake, free));
    setNotice(null);
    setSettlement(null);
    setMatch({
      id: Date.now(),
      timeControl: opponent.timeControl,
      playerColor: randomColor(),
      engine: reuse ?? new HumanEngine(opponent.elo, t.opponents[opponent.id].name),
      opponent,
      free,
    });
  };

  const playTest = ({ timeControl, playerColor, elo }: TestSettings) => {
    setSettlement(null);
    setMatch({ id: Date.now(), timeControl, playerColor, engine: new HumanEngine(elo, t.levels[elo]), opponent: null, free: false });
  };

  const onFinish = useCallback((result: GameResult) => {
    if (!match?.opponent) return;
    const res = settleMatch(save, outcomeFor(result, match.playerColor));
    setSave(res.save);
    setSettlement(res);
  }, [match, save]);

  const resultExtra = settlement && match?.opponent ? <MoneyResult settlement={settlement} free={match.free} /> : null;

  let rematchLabel: string | null = t.actions.rematch;
  if (match?.opponent) {
    const o = match.opponent;
    rematchLabel = match.free || !canAfford(save, o.stake) ? null : t.money.rematchFor(formatMoney(o.stake));
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1>{t.appTitle}</h1>
        <span className="balance" title={t.money.balance}>
          <span className="coin" aria-hidden />
          {formatMoney(save.balance)}
        </span>
      </header>

      {match ? (
        <GameScreen
          key={match.id}
          timeControl={match.timeControl}
          playerColor={match.playerColor}
          engine={match.engine}
          opponentName={match.opponent ? t.opponents[match.opponent.id].name : undefined}
          opponentTag={match.opponent
            ? (match.free ? t.money.freeGameTag : `${t.money.stake} ${formatMoney(match.opponent.stake)}`)
            : undefined}
          onFinish={onFinish}
          resultExtra={resultExtra}
          rematchLabel={rematchLabel}
          newGameLabel={match.opponent ? t.money.back : t.actions.newGame}
          onRematch={() => {
            if (match.opponent) playOpponent(match.opponent, false, match.engine);
            else setMatch({ ...match, id: Date.now() });
          }}
          onNewGame={() => setMatch(null)}
        />
      ) : screen === 'test' ? (
        <TestSetup
          onStart={playTest}
          onBack={() => setScreen('home')}
          onReset={() => { setSave(newSave()); setScreen('home'); }}
        />
      ) : (
        <HomeScreen
          save={save}
          opponent={OPPONENTS[0]}
          notice={notice}
          onPlay={(free) => playOpponent(OPPONENTS[0], free)}
          onTest={() => setScreen('test')}
        />
      )}
    </main>
  );
}

function MoneyResult({ settlement, free }: { settlement: Settlement; free: boolean }) {
  const { delta, outcome, save } = settlement;
  let text: string;
  let cls: string;
  if (delta > 0) {
    text = t.money.won(formatMoney(delta));
    cls = 'plus';
  } else if (delta < 0) {
    text = t.money.lost(formatMoney(-delta));
    cls = 'minus';
  } else {
    text = free || outcome !== 'draw' ? t.money.nothing : t.money.stakeBack;
    cls = 'even';
  }
  return (
    <div className="money-result">
      <p className={`money-delta ${cls}`}>{text}</p>
      <p className="money-balance">{t.money.newBalance(formatMoney(save.balance))}</p>
    </div>
  );
}
