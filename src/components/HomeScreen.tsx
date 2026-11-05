import { canAfford, FREE_GAME_REWARD, recordOf, type SaveData } from '../game/career';
import { formatMoney } from '../game/format';
import { knownRange, OPPONENTS, PLACES, type Opponent } from '../game/opponents';
import { overallRating } from '../game/rating';
import { t } from '../i18n/de';
import { Avatar } from './Avatar';

export function HomeScreen({ save, notice, onPlay, onTest }: {
  save: SaveData;
  notice: string | null;
  onPlay: (opponent: Opponent, free: boolean) => void;
  onTest: () => void;
}) {
  const overall = overallRating(save.ratings);
  const cheapest = OPPONENTS.reduce((a, b) => (b.stake < a.stake ? b : a));
  const broke = !canAfford(save, cheapest.stake);
  const { wins, draws, losses } = save.stats;

  return (
    <section className="home">
      {notice && <p className="notice">{notice}</p>}

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

      {broke && (
        <div className="broke">
          <p>{t.money.broke}</p>
          <button className="btn primary" onClick={() => onPlay(cheapest, true)}>
            {t.money.freeGame(formatMoney(FREE_GAME_REWARD))}
          </button>
        </div>
      )}

      {PLACES.map((place) => (
        <div key={place}>
          <h2>{t.places[place]}</h2>
          {OPPONENTS.filter((o) => o.place === place).map((o) => (
            <OpponentCard key={o.id} opponent={o} save={save} overallElo={overall.value} onPlay={() => onPlay(o, false)} />
          ))}
        </div>
      ))}

      <button className="btn ghost small test-link" onClick={onTest}>{t.home.testGame}</button>
      <p className="hint center">{t.money.virtual}<br />{t.rating.notice}</p>
    </section>
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
