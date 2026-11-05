import { useEffect, useState } from 'react';
import type { Color } from 'chess.js';
import { GameScreen } from './components/GameScreen';
import { HumanEngine } from './engine/humanEngine';
import { TIME_CONTROLS, type TimeControl } from './game/timeControls';
import { t } from './i18n/de';

type ColorChoice = Color | 'random';

interface Match {
  id: number;
  timeControl: TimeControl;
  playerColor: Color;
  engine: HumanEngine;
}

const LEVELS = [400, 800, 1200, 1600, 2000];

export default function App() {
  const [timeControl, setTimeControl] = useState<TimeControl>(TIME_CONTROLS[2]);
  const [colorChoice, setColorChoice] = useState<ColorChoice>('w');
  const [level, setLevel] = useState(800);
  const [match, setMatch] = useState<Match | null>(null);

  // Den Rechen-Thread des alten Gegners beenden, wenn ein neuer kommt
  const engine = match?.engine;
  useEffect(() => () => engine?.dispose(), [engine]);

  const start = () => {
    const playerColor: Color = colorChoice === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : colorChoice;
    // Hier wird der Gegner ausgetauscht, sobald es weitere Engines gibt.
    const engine = new HumanEngine(level, t.levels[level]);
    setMatch({ id: Date.now(), timeControl, playerColor, engine });
  };

  return (
    <main className="app">
      <header className="app-header">
        <h1>{t.appTitle}</h1>
      </header>

      {match ? (
        <GameScreen
          key={match.id}
          timeControl={match.timeControl}
          playerColor={match.playerColor}
          engine={match.engine}
          onRematch={() => setMatch({ ...match, id: Date.now() })}
          onNewGame={() => setMatch(null)}
        />
      ) : (
        <section className="setup">
          <p className="subtitle">{t.setup.subtitle}</p>

          <h2>{t.setup.timeControl}</h2>
          <div className="chips">
            {TIME_CONTROLS.map((tc) => (
              <button
                key={tc.id}
                className={`chip${tc.id === timeControl.id ? ' selected' : ''}`}
                onClick={() => setTimeControl(tc)}
              >
                {tc.label}
              </button>
            ))}
          </div>

          <h2>{t.setup.color}</h2>
          <div className="chips">
            {([['w', t.setup.white], ['b', t.setup.black], ['random', t.setup.random]] as const).map(([value, label]) => (
              <button
                key={value}
                className={`chip${value === colorChoice ? ' selected' : ''}`}
                onClick={() => setColorChoice(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <h2>{t.setup.strength}</h2>
          <div className="chips">
            {LEVELS.map((elo) => (
              <button
                key={elo}
                className={`chip${elo === level ? ' selected' : ''}`}
                onClick={() => setLevel(elo)}
              >
                {t.levels[elo]} <span className="chip-sub">~{elo}</span>
              </button>
            ))}
          </div>
          <p className="hint">{t.setup.strengthHint}</p>

          <button className="btn primary big" onClick={start}>{t.setup.start}</button>
        </section>
      )}
    </main>
  );
}
