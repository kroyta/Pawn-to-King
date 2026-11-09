import { useState } from 'react';
import { PLAYER_LOOKS } from '../game/art';
import { t } from '../i18n/de';

/** Eigene Figur erstellen: Name und Aussehen. */
export function CreatePlayer({ initial, onDone, onCancel }: {
  initial?: { name: string; look: string } | null;
  onDone: (player: { name: string; look: string }) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [look, setLook] = useState(initial?.look ?? PLAYER_LOOKS[0].id);
  const trimmed = name.trim().slice(0, 18);

  return (
    <section className="create">
      {onCancel && <button className="btn ghost small back" onClick={onCancel}>← {t.home.back}</button>}
      <h2>{t.create.title}</h2>
      <p className="subtitle">{t.create.intro}</p>

      <label className="create-label" htmlFor="player-name">{t.create.name}</label>
      <input
        id="player-name"
        className="create-input"
        value={name}
        maxLength={18}
        placeholder={t.create.placeholder}
        autoComplete="off"
        onChange={(e) => setName(e.target.value)}
      />

      <p className="create-label">{t.create.look}</p>
      <div className="look-grid">
        {PLAYER_LOOKS.map((l) => (
          <button
            key={l.id}
            className={`look${l.id === look ? ' selected' : ''}`}
            aria-pressed={l.id === look}
            onClick={() => setLook(l.id)}
          >
            <img src={l.sprite} alt="" draggable={false} />
          </button>
        ))}
      </div>

      <button className="btn primary big" disabled={!trimmed} onClick={() => onDone({ name: trimmed, look })}>
        {t.create.start}
      </button>
    </section>
  );
}
