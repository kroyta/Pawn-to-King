import { useCallback, useEffect, useRef, useState } from 'react';
import type { Color } from 'chess.js';
import { CityScreen, type CityActions } from './components/CityScreen';
import { GameScreen, type Persona, type TipOptions } from './components/GameScreen';
import { PuzzleScreen } from './components/PuzzleScreen';
import { TestSetup, type TestSettings } from './components/TestSetup';
import { HumanEngine } from './engine/humanEngine';
import {
  canAfford, newSave, outcomeFor, resolveAbandoned, settleMatch, spend, startMatch,
  type SaveData, type Settlement,
} from './game/career';
import { OPPONENT_ART } from './game/art';
import { CreatePlayer } from './components/CreatePlayer';
import { formatMoney } from './game/format';
import { dayElo, opponentById, type Opponent } from './game/opponents';
import { START_PLACE, type PlaceId } from './game/places';
import { DAILY_REWARD, puzzleOfDay, todayKey } from './game/puzzles';
import { formatOf, overallRating } from './game/rating';
import type { GameResult } from './game/result';
import { themeById } from './game/shop';
import { isMuted, play, setMuted } from './game/sound';
import { debugEnabled, setDebugEnabled } from './game/debug';
import { DebugPanel } from './components/DebugPanel';
import { loadSave, storeSave } from './game/storage';
import type { TimeControl } from './game/timeControls';
import { TIP_KINDS, tipPrice, type TipKind } from './game/tips';
import { advance, CITY_TOURNAMENT, drawTournament, timeControlFor } from './game/tournament';
import { t } from './i18n/de';

type MatchKind = 'money' | 'free' | 'tournament' | 'test';

interface Match {
  id: number;
  kind: MatchKind;
  timeControl: TimeControl;
  playerColor: Color;
  engine: HumanEngine;
  /** null = freie Testpartie ohne Geld und ohne Elo */
  opponent: Opponent | null;
  persona?: Persona;
}

/** Was nach einer Turnierpartie passiert, für das Ergebnisfenster */
type TournamentNote = { kind: 'tiebreak' | 'final' | 'won' | 'lost'; text: string };

type Screen = 'home' | 'test' | 'puzzle' | 'player';

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
  const [tournamentNote, setTournamentNote] = useState<TournamentNote | null>(null);
  // Wo die eigene Figur steht und welcher Ort offen ist. Nach einer Partie geht es am selben Ort weiter.
  const [location, setLocation] = useState<PlaceId>(START_PLACE);
  const [openPlace, setOpenPlace] = useState<PlaceId | null>(null);

  // Aktueller Spielstand für Rückrufe aus der Partie (Tipps bezahlen)
  const saveRef = useRef(save);
  saveRef.current = save;

  // Jede Änderung sofort speichern
  useEffect(() => storeSave(save), [save]);

  // Den Rechen-Thread des alten Gegners beenden, wenn ein neuer kommt
  const engine = match?.engine;
  useEffect(() => () => engine?.dispose(), [engine]);

  const boardColors = themeById(save.boardTheme);
  const [muted, setMutedState] = useState(isMuted);

  // Debug: fünfmal schnell auf den Titel tippen oder ?debug an die Adresse hängen
  const [debugOn, setDebugOn] = useState(debugEnabled);
  const [debugOpen, setDebugOpen] = useState(false);
  const titleTaps = useRef<number[]>([]);
  const onTitleTap = () => {
    const now = Date.now();
    titleTaps.current = [...titleTaps.current.filter((x) => now - x < 2000), now];
    if (titleTaps.current.length >= 5) {
      titleTaps.current = [];
      setDebugEnabled(true);
      setDebugOn(true);
      setDebugOpen(true);
    }
  };

  const beginMatch = (base: SaveData, opponent: Opponent, kind: MatchKind, timeControl: TimeControl) => {
    const elo = dayElo(opponent);
    const text = t.opponents[opponent.id];
    // Einsatz wird beim Start einbehalten
    setSave(startMatch(base, {
      opponentId: opponent.id,
      stake: opponent.stake,
      free: kind === 'free',
      tournament: kind === 'tournament',
      opponentElo: elo,
      format: formatOf(timeControl),
    }));
    setNotice(null);
    setSettlement(null);
    setTournamentNote(null);
    setMatch({
      id: Date.now(),
      kind,
      timeControl,
      playerColor: randomColor(),
      engine: new HumanEngine(elo, text.name, opponent.style),
      opponent,
      persona: { color: opponent.avatar.color, sprites: OPPONENT_ART[opponent.id], lines: text.lines },
    });
  };

  const playTournamentRound = (base: SaveData) => {
    if (!base.tournament) return;
    const opponent = opponentById(base.tournament.opponentId)!;
    beginMatch(base, opponent, 'tournament', timeControlFor(base.tournament));
  };

  const actions: CityActions = {
    onPlay: (opponent, free) => beginMatch(save, opponent, free ? 'free' : 'money', opponent.timeControl),
    onTest: () => { setOpenPlace(null); setScreen('test'); },
    onEditPlayer: () => { setOpenPlace(null); setScreen('player'); },
    onPuzzle: () => { setOpenPlace(null); setScreen('puzzle'); },
    onBuyDossier: (opponent, price) => {
      const s = spend(save, price);
      if (s) setSave({ ...s, dossiers: [...s.dossiers, opponent.id] });
    },
    onBuyItem: (id, price) => {
      const s = spend(save, price);
      if (!s) return;
      const isTheme = id !== 'classic' && themeById(id).id === id;
      setSave({ ...s, owned: [...s.owned, id], boardTheme: isTheme ? id : s.boardTheme });
    },
    onSelectTheme: (id) => setSave({ ...save, boardTheme: id }),
    onEnterTournament: () => {
      const s = spend(save, CITY_TOURNAMENT.entryFee);
      if (s) setSave({ ...s, tournament: drawTournament() });
    },
    onPlayTournament: () => playTournamentRound(save),
  };

  const playTest = ({ timeControl, playerColor, elo }: TestSettings) => {
    setSettlement(null);
    setTournamentNote(null);
    setMatch({ id: Date.now(), kind: 'test', timeControl, playerColor, engine: new HumanEngine(elo, t.levels[elo]), opponent: null });
  };

  const onFinish = useCallback((result: GameResult, { tipsUsed }: { tipsUsed: number }) => {
    if (!match?.opponent) return;
    const outcome = outcomeFor(result, match.playerColor);
    const res = settleMatch(save, outcome, { tipsUsed });
    if (!res) return;
    let next = res.save;

    if (match.kind === 'tournament' && next.tournament) {
      const step = advance(next.tournament, outcome);
      if (step.kind === 'tiebreak') {
        next = { ...next, tournament: step.state };
        setTournamentNote({ kind: 'tiebreak', text: t.tournament.tiebreakNext });
      } else if (step.kind === 'final') {
        next = { ...next, tournament: step.state };
        setTournamentNote({ kind: 'final', text: t.tournament.advanced(t.opponents[step.state.opponentId].name) });
      } else if (step.kind === 'won') {
        next = { ...next, tournament: null, cityFinalWon: true, balance: next.balance + CITY_TOURNAMENT.prize };
        setTournamentNote({ kind: 'won', text: t.tournament.won(formatMoney(CITY_TOURNAMENT.prize)) });
      } else {
        next = { ...next, tournament: null };
        setTournamentNote({ kind: 'lost', text: t.tournament.lost });
      }
    }
    setSave(next);
    setSettlement({ ...res, save: next });
    // Münzklimpern, wenn es mehr gibt als den zurückgezahlten Einsatz
    const stakeBack = match.kind === 'money' ? match.opponent.stake : 0;
    if (next.balance - save.balance > stakeBack) setTimeout(() => play('coin'), 900);
  }, [match, save]);

  // Tipps: in Geldpartien gegen Spielgeld, in der Testpartie gratis, im Turnier keine
  let tips: TipOptions | undefined;
  if (match && match.kind !== 'tournament') {
    const stake = match.kind === 'money' ? match.opponent!.stake : 0;
    const prices = Object.fromEntries(
      TIP_KINDS.map((k) => [k, match.kind === 'test' ? 0 : tipPrice(k, stake)]),
    ) as Record<TipKind, number>;
    tips = {
      prices,
      onBuy: (_kind, price) => {
        if (price === 0) return true;
        const s = spend(saveRef.current, price);
        if (!s) return false;
        setSave(s);
        return true;
      },
    };
  }

  const o = match?.opponent ?? null;
  const resultExtra = settlement && o
    ? <MatchSummary settlement={settlement} free={match!.kind === 'free'} opponentName={t.opponents[o.id].name} note={tournamentNote} />
    : null;

  let rematchLabel: string | null = t.actions.rematch;
  let onRematch = () => match && setMatch({ ...match, id: Date.now() });
  if (match?.kind === 'tournament') {
    const continues = tournamentNote?.kind === 'tiebreak' || tournamentNote?.kind === 'final';
    rematchLabel = continues ? t.tournament.play : null;
    onRematch = () => playTournamentRound(save);
  } else if (o) {
    rematchLabel = match!.kind === 'free' || !canAfford(save, o.stake) ? null : t.money.rematchFor(formatMoney(o.stake));
    onRematch = () => beginMatch(save, o, 'money', o.timeControl);
  }

  const playerElo = () => {
    if (!match) return undefined;
    const r = save.ratings[formatOf(match.timeControl)];
    return `Elo ${r?.value ?? overallRating(save.ratings).value}`;
  };

  let opponentTag: string | undefined;
  if (o) {
    opponentTag = match!.kind === 'free' ? t.money.freeGameTag
      : match!.kind === 'tournament' ? t.tournament.tag
      : formatMoney(o.stake);
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1><button className="title-btn" onClick={onTitleTap}>{t.appTitle}</button></h1>
        <div className="header-right">
          {debugOn && (
            <button className="sound-btn" aria-label={t.debug.open} title={t.debug.open} onClick={() => setDebugOpen(true)}>
              <span aria-hidden>🐞</span>
            </button>
          )}
          <button
            className="sound-btn"
            aria-label={muted ? t.sound.on : t.sound.off}
            title={muted ? t.sound.on : t.sound.off}
            onClick={() => { setMuted(!muted); setMutedState(!muted); }}
          >
            <SpeakerIcon muted={muted} />
          </button>
          <span key={save.balance} className="balance bump" title={t.money.balance}>
            <span className="coin" aria-hidden />
            {formatMoney(save.balance)}
          </span>
        </div>
      </header>

      {debugOpen && (
        <DebugPanel
          save={save}
          onChange={(s) => { setSave(s); if (s.balance !== save.balance) play('coin'); }}
          onClose={() => setDebugOpen(false)}
          onDisable={() => { setDebugEnabled(false); setDebugOn(false); setDebugOpen(false); }}
        />
      )}

      {match ? (
        <GameScreen
          key={match.id}
          timeControl={match.timeControl}
          playerColor={match.playerColor}
          engine={match.engine}
          persona={match.persona}
          opponentName={o ? t.opponents[o.id].name : undefined}
          opponentTag={opponentTag}
          playerTag={o ? playerElo() : undefined}
          playerName={save.player?.name}
          onFinish={onFinish}
          tips={tips}
          boardColors={boardColors}
          resultExtra={resultExtra}
          rematchLabel={rematchLabel}
          newGameLabel={o ? t.money.back : t.actions.newGame}
          onRematch={onRematch}
          onNewGame={() => setMatch(null)}
        />
      ) : !save.player || screen === 'player' ? (
        <CreatePlayer
          initial={save.player}
          onDone={(player) => { setSave({ ...save, player }); setScreen('home'); }}
          onCancel={save.player ? () => setScreen('home') : undefined}
        />
      ) : screen === 'puzzle' ? (
        <PuzzleScreen
          fen={puzzleOfDay()}
          alreadySolved={save.dailySolved === todayKey()}
          colors={boardColors}
          onSolved={() => setSave((s) => ({ ...s, balance: s.balance + DAILY_REWARD, dailySolved: todayKey() }))}
          onBack={() => setScreen('home')}
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
          actions={actions}
        />
      )}
    </main>
  );
}

function MatchSummary({ settlement, free, opponentName, note }: {
  settlement: Settlement;
  free: boolean;
  opponentName: string;
  note: TournamentNote | null;
}) {
  const { moneyDelta, outcome, save, rating, opponentElo, bonus, tipsUsed, tournament } = settlement;
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
      {tournament && note ? (
        <p className={`tour-status${note.kind === 'won' ? ' win' : ''}`}>{note.text}</p>
      ) : (
        <>
          <p className={`money-delta ${cls}`}>{money}</p>
          {bonus > 0 && <p className="money-bonus">{t.tips.noHelpBonus(formatMoney(bonus))}</p>}
        </>
      )}
      <p className="money-balance">{t.money.newBalance(formatMoney(save.balance))}</p>
      <div className="reveal">
        <p className="reveal-elo">{t.rating.reveal(opponentName, opponentElo)}</p>
        <p className="reveal-rating">
          {t.rating.change(t.rating.formats[rating.format], rating.before, rating.after, rating.delta)}
        </p>
        {tipsUsed > 0 && rating.delta > 0 && <p className="money-note">{t.tips.eloReduced}</p>}
      </div>
    </div>
  );
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 9 H8 L13 5 V19 L8 15 H4 Z" fill="currentColor" />
      {muted ? <path d="M17 9 L22 14 M22 9 L17 14" /> : <path d="M16.5 8.5 a5 5 0 0 1 0 7 M19 6 a8.5 8.5 0 0 1 0 12" />}
    </svg>
  );
}
