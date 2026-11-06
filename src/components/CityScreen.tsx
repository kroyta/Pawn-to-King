import { canAfford, FREE_GAME_REWARD, recordOf, type SaveData } from '../game/career';
import { formatMoney } from '../game/format';
import { knownRange, OPPONENTS, type Opponent } from '../game/opponents';
import { ALL_PLACES, type PlaceId } from '../game/places';
import { overallRating } from '../game/rating';
import { t } from '../i18n/de';
import { Avatar } from './Avatar';
import { CityMap, type MapPlace } from './CityMap';

/** Mindest-Elo eines Ortes: das niedrigste Mindest-Elo seiner Gegner */
function placeMinElo(place: PlaceId): number | undefined {
  const mins = OPPONENTS.filter((o) => o.place === place).map((o) => o.minElo ?? 0);
  if (mins.length === 0) return undefined;
  const m = Math.min(...mins);
  return m > 0 ? m : undefined;
}

export function CityScreen({ save, notice, location, openPlace, onLocationChange, onOpenPlace, onPlay, onTest }: {
  save: SaveData;
  notice: string | null;
  location: PlaceId;
  openPlace: PlaceId | null;
  onLocationChange: (place: PlaceId) => void;
  onOpenPlace: (place: PlaceId | null) => void;
  onPlay: (opponent: Opponent, free: boolean) => void;
  onTest: () => void;
}) {
  const overall = overallRating(save.ratings);
  const cheapest = OPPONENTS.reduce((a, b) => (b.stake < a.stake ? b : a));
  const broke = !canAfford(save, cheapest.stake);

  const places: MapPlace[] = ALL_PLACES.map((id) => {
    const minElo = placeMinElo(id);
    let locked = false;
    let lockLabel: string | undefined;
    if (minElo !== undefined && overall.value < minElo) {
      locked = true;
      lockLabel = t.rating.locked(minElo);
    } else if (id === 'hall') {
      locked = true;
      lockLabel = t.city.soon;
    } else if (id === 'station') {
      locked = true;
    }
    return {
      id,
      label: t.mapLabels[id] ?? t.places[id],
      locked,
      lockLabel,
      opponents: OPPONENTS.filter((o) => o.place === id).map((o) => o.avatar.color),
    };
  });

  return (
    <section className="city">
      {notice && <p className="notice">{notice}</p>}
      {broke && (
        <div className="broke">
          <p>{t.money.broke}</p>
          <button className="btn primary" onClick={() => onPlay(cheapest, true)}>
            {t.money.freeGame(formatMoney(FREE_GAME_REWARD))}
          </button>
        </div>
      )}

      <div className="city-top">
        <span className="elo-chip">
          Elo <b>{overall.value}</b>
          {overall.provisional && <span className="elo-badge">{t.rating.provisional}</span>}
        </span>
        <span className="hint">{t.city.tapHint}</span>
      </div>

      <div className="map-wrap">
        <CityMap
          places={places}
          location={location}
          onArrive={(p) => {
            onLocationChange(p);
            onOpenPlace(p);
          }}
        />
      </div>

      {openPlace && (
        <PlaceSheet
          place={openPlace}
          locked={places.find((p) => p.id === openPlace)!.locked}
          save={save}
          overallElo={overall.value}
          onClose={() => onOpenPlace(null)}
          onPlay={onPlay}
          onTest={onTest}
        />
      )}
    </section>
  );
}

function PlaceSheet({ place, locked, save, overallElo, onClose, onPlay, onTest }: {
  place: PlaceId;
  locked: boolean;
  save: SaveData;
  overallElo: number;
  onClose: () => void;
  onPlay: (opponent: Opponent, free: boolean) => void;
  onTest: () => void;
}) {
  const opponents = OPPONENTS.filter((o) => o.place === place);
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label={t.places[place]} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-head">
          <h2>{t.places[place]}</h2>
          <button className="btn ghost small" onClick={onClose}>{t.city.close}</button>
        </div>
        <p className="sheet-desc">{t.city.descriptions[place]}</p>

        {place === 'home' && (
          <>
            <EloCard save={save} />
            <button className="btn ghost small test-link" onClick={onTest}>{t.home.testGame}</button>
            <p className="hint center">{t.money.virtual}<br />{t.rating.notice}</p>
          </>
        )}

        {opponents.map((o) => (
          <OpponentCard key={o.id} opponent={o} save={save} overallElo={overallElo} onPlay={() => onPlay(o, false)} />
        ))}

        {locked && opponents.length === 0 && <p className="sheet-locked">{t.city.lockedText[place]}</p>}
      </div>
    </div>
  );
}

function EloCard({ save }: { save: SaveData }) {
  const overall = overallRating(save.ratings);
  const { wins, draws, losses } = save.stats;
  return (
    <article className="elo-card">
      <div className="elo-main">
        <span className="elo-label">{t.rating.yourElo}</span>
        <span className="elo-value">{overall.value}</span>
        {overall.provisional && <span className="elo-badge">{t.rating.provisional}</span>}
      </div>
      <div className="elo-formats">
        {(['blitz', 'rapid', 'none'] as const).map((f) => (
          <span key={f}>{t.rating.formats[f]} <b>{save.ratings[f]?.value ?? '–'}</b></span>
        ))}
      </div>
      <p className="stats">{t.stats(wins, draws, losses)}</p>
    </article>
  );
}

function OpponentCard({ opponent: o, save, overallElo, onPlay }: {
  opponent: Opponent;
  save: SaveData;
  overallElo: number;
  onPlay: () => void;
}) {
  const text = t.opponents[o.id];
  const rec = recordOf(save, o.id);
  const range = knownRange(o, rec.games);
  const locked = o.minElo !== undefined && overallElo < o.minElo;
  const affordable = canAfford(save, o.stake);

  return (
    <article className={`opponent-card${locked ? ' locked' : ''}`}>
      <div className="opponent-head">
        <Avatar color={o.avatar.color} size={52} />
        <div className="opponent-meta">
          <p className="opponent-name">{text.name}</p>
          <p className="opponent-place">{o.timeControl.label}</p>
        </div>
        <span className="stake-amount">{formatMoney(o.stake)}</span>
      </div>
      <p className="reputation">{text.reputation}</p>
      <p className="strength">
        {range ? t.rating.strengthRange(range[0], range[1]) : t.rating.strengthUnknown}
        {rec.games > 0 && <span className="record"> · {t.rating.record(rec.wins, rec.draws, rec.losses)}</span>}
      </p>
      {locked ? (
        <button className="btn big" disabled>{t.rating.locked(o.minElo!)}</button>
      ) : (
        <button className="btn primary big" disabled={!affordable} onClick={onPlay}>
          {affordable ? t.money.playFor(formatMoney(o.stake)) : t.money.tooExpensive}
        </button>
      )}
    </article>
  );
}
