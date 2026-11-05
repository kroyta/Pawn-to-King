import { useState } from 'react';
import type { Color } from 'chess.js';
import { TIME_CONTROLS, type TimeControl } from '../game/timeControls';
import { t } from '../i18n/de';

type ColorChoice = Color | 'random';

export const LEVELS = [400, 800, 1200, 1600, 2000];

export interface TestSettings {
  timeControl: TimeControl;
  playerColor: Color;
  elo: number;
}

/** Freie Testpartie ohne Geld, mit frei wählbarer Stärke. */
export function TestSetup({ onStart, onBack, onReset }: {
  onStart: (s: TestSettings) => void;
  onBack: () => void;
  onReset: () => void;
}) {
  const [timeControl, setTimeControl] = useState<TimeControl>(TIME_CONTROLS[2]);
  const [colorChoice, setColorChoice] = useState<ColorChoice>('w');
  const [level, setLevel] = useState(800);
  const [confirmReset, setConfirmReset] = useState(false);

  const start = () => {
    const playerColor: Color = colorChoice === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : colorChoice;
    onStart({ timeControl, playerColor, elo: level });
  };

  return (
    <section className="setup">
      <button className="btn ghost small back" onClick={onBack}>← {t.home.back}</button>
      <p className="subtitle">{t.home.testGame}</p>

      <h2>{t.setup.timeControl}</h2>
      <div className="chips">
        {TIME_CONTROLS.map((tc) => (
          <button key={tc.id} className={`chip${tc.id === timeControl.id ? ' selected' : ''}`} onClick={() => setTimeControl(tc)}>
            {tc.label}
          </button>
        ))}
      </div>

      <h2>{t.setup.color}</h2>
      <div className="chips">
        {([['w', t.setup.white], ['b', t.setup.black], ['random', t.setup.random]] as const).map(([value, label]) => (
          <button key={value} className={`chip${value === colorChoice ? ' selected' : ''}`} onClick={() => setColorChoice(value)}>
            {label}
          </button>
        ))}
      </div>

      <h2>{t.setup.strength}</h2>
      <div className="chips">
        {LEVELS.map((elo) => (
          <button key={elo} className={`chip${elo === level ? ' selected' : ''}`} onClick={() => setLevel(elo)}>
            {t.levels[elo]} <span className="chip-sub">~{elo}</span>
          </button>
        ))}
      </div>
      <p className="hint">{t.setup.strengthHint}</p>

      <button className="btn primary big" onClick={start}>{t.setup.start}</button>

      <div className="reset">
        {confirmReset ? (
          <div className="btn-row">
            <span className="confirm-text">{t.home.confirmReset}</span>
            <button className="btn danger small" onClick={() => { onReset(); setConfirmReset(false); }}>{t.actions.yes}</button>
            <button className="btn small" onClick={() => setConfirmReset(false)}>{t.actions.no}</button>
          </div>
        ) : (
          <button className="btn ghost small" onClick={() => setConfirmReset(true)}>{t.home.resetSave}</button>
        )}
      </div>
    </section>
  );
}
