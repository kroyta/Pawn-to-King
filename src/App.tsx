import { useCallback, useEffect, useState } from 'react';
import type { Color } from 'chess.js';
import { GameScreen, type Persona } from './components/GameScreen';
import { CityScreen } from './components/CityScreen';
import { TestSetup, type TestSettings } from './components/TestSetup';
import { HumanEngine } from './engine/humanEngine';
import {
  canAfford, newSave, outcomeFor, resolveAbandoned, settleMatch, startMatch,
  type SaveData, type Settlement,
} from './game/career';
import { formatMoney } from './game/format';
import { dayElo, type Opponent } from './game/opponents';
import { START_PLACE, type PlaceId } from './game/places';
import { formatOf, overallRating } from './game/rating';
import type { GameResult } from './game/result';
import { loadSave, storeSave } from './game/storage';
import type { TimeControl } from './game/timeControls';
import { t } from './i18n/de';

interface Match {
  id: number;
  timeControl: TimeControl;
  playerColor: Color;
  engine: HumanEngine;
  /** null = freie Testpartie ohne Geld und ohne Elo */
  opponent: Opponent | null;
  persona?: Persona;
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
  // Wo die eigene Figur steht und welcher Ort offen ist. Nach einer Partie geht es am selben Ort weiter.
  const [location, setLocation] = useState<PlaceId>(START_PLACE);
  const [openPlace, setOpenPlace] = useState<PlaceId | null>(null);

  // Jede Änderung sofort speichern
  useEffect(() => storeSave(save), [save]);

  // Den Rechen-Thread des alten Gegners beenden, wenn ein neuer kommt
  const engine = match?.engine;
  useEffect(() => () => engine?.dispose(), [engine]);

  const playOpponent = (opponent: Opponent, free: boolean) => {
    const elo = dayElo(opponent);
    const text = t.opponents[opponent.id];
    // Einsatz wird beim Start einbehalten
    setSave(startMatch(save, {
      opponentId: opponent.id, stake: opponent.stake, free, opponentElo: elo, format: formatOf(opponent.timeControl),
    }));
    setNotice(null);
    setSettlement(null);
    setMatch({
      id: Date.now(),
      timeControl: opponent.timeControl,
      playerColor: randomColor(),
      engine: new HumanEngine(elo, text.name, opponent.style),
      opponent,
      persona: { color: opponent.avatar.color, lines: text.lines },
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
    if (!res) return;
    setSave(res.save);
    setSettlement(res);
  }, [match, save]);

  const o = match?.opponent ?? null;
  const resultExtra = settlement && o
    ? <MatchSummary settlement={settlement} free={match!.free} opponentName={t.opponents[o.id].name} />
    : null;

  let rematchLabel: string | null = t.actions.rematch;
  if (o) rematchLabel = match!.free || !canAfford(save, o.stake) ? null : t.money.rematchFor(formatMoney(o.stake));

  const playerElo = () => {
    if (!match) return undefined;
    const r = save.ratings[formatOf(match.timeControl)];
    return `Elo ${r?.value ?? overallRating(save.ratings).value}`;
  };

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
          persona={match.persona}
          opponentName={o ? t.opponents[o.id].name : undefined}
          opponentTag={o ? (match.free ? t.money.freeGameTag : formatMoney(o.stake)) : undefined}
          playerTag={o ? playerElo() : undefined}
          onFinish={onFinish}
          resultExtra={resultExtra}
          rematchLabel={rematchLabel}
          newGameLabel={o ? t.money.back : t.actions.newGame}
          onRematch={() => {
            if (o) playOpponent(o, false);
            else setMatch({ ...match, id: Date.now() });
          }}
          onNewGame={() => setMatch(null)}
        />
      ) : screen === 'test' ? (
        <TestSetup
          onStart={playTest}
          onBack={() => setScreen('home')}
          onReset={() => { setSave(newSave()); setLocation(START_PLACE); setScreen('home'); }}
        />
      ) : (
        <CityScreen
          save={save}
          notice={notice}
          location={location}
          openPlace={openPlace}
          onLocationChange={setLocation}
          onOpenPlace={setOpenPlace}
          onPlay={playOpponent}
          onTest={() => { setOpenPlace(null); setScreen('test'); }}
        />
      )}
    </main>
  );
}

function MatchSummary({ settlement, free, opponentName }: { settlement: Settlement; free: boolean; opponentName: string }) {
  const { moneyDelta, outcome, save, rating, opponentElo } = settlement;
  let money: string;
  let cls: string;
  if (moneyDelta > 0) {
    money = t.money.won(formatMoney(moneyDelta));
    cls = 'plus';
  } else if (moneyDelta < 0) {
    money = t.money.lost(formatMoney(-moneyDelta));
    cls = 'minus';
  } else {
    money = free || outcome !== 'draw' ? t.money.nothing : t.money.stakeBack;
    cls = 'even';
  }
  return (
    <div className="money-result">
      <p className={`money-delta ${cls}`}>{money}</p>
      <p className="money-balance">{t.money.newBalance(formatMoney(save.balance))}</p>
      <div className="reveal">
        <p className="reveal-elo">{t.rating.reveal(opponentName, opponentElo)}</p>
        <p className="reveal-rating">
          {t.rating.change(t.rating.formats[rating.format], rating.before, rating.after, rating.delta)}
        </p>
      </div>
    </div>
  );
}
