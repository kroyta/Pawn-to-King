import { canAfford, FREE_GAME_REWARD, recordOf, type SaveData } from '../game/career';
import { BUILDING_ART, OPPONENT_ART } from '../game/art';
import { formatMoney } from '../game/format';
import { knownRange, opponentById, OPPONENTS, type Opponent } from '../game/opponents';
import { ALL_PLACES, type PlaceId } from '../game/places';
import { DAILY_REWARD, todayKey } from '../game/puzzles';
import { overallRating } from '../game/rating';
import { BOARD_THEMES, dossierPrice, FURNITURE } from '../game/shop';
import { CITY_TOURNAMENT } from '../game/tournament';
import { t } from '../i18n/de';
import { Portrait } from './Avatar';
import { CityMap, type MapPlace } from './CityMap';

export interface CityActions {
  onPlay: (opponent: Opponent, free: boolean) => void;
  onTest: () => void;
  onPuzzle: () => void;
  onBuyDossier: (opponent: Opponent, price: number) => void;
  onBuyItem: (id: string, price: number) => void;
  onSelectTheme: (id: string) => void;
  onEnterTournament: () => void;
  onPlayTournament: () => void;
}

export function CityScreen({ save, notice, location, openPlace, onLocationChange, onOpenPlace, actions }: {
  save: SaveData;
  notice: string | null;
  location: PlaceId;
  openPlace: PlaceId | null;
  onLocationChange: (place: PlaceId) => void;
  onOpenPlace: (place: PlaceId | null) => void;
  actions: CityActions;
}) {
  const overall = overallRating(save.ratings);
  const cheapest = OPPONENTS.reduce((a, b) => (b.stake < a.stake ? b : a));
  const broke = !canAfford(save, cheapest.stake);
  const dailyOpen = save.dailySolved !== todayKey();

  const places: MapPlace[] = ALL_PLACES.map((id) => {
    // Alle Orte sind offen. Nur der Bahnhof wartet auf den Sieg im Stadtfinale.
    const locked = id === 'station' && !save.cityFinalWon;
    return {
      id,
      label: t.mapLabels[id] ?? t.places[id],
      locked,
      opponents: OPPONENTS.filter((o) => o.place === id).map((o) => ({ id: o.id, color: o.avatar.color })),
    };
  });

  return (
    <section className="city">
      {notice && <p className="notice">{notice}</p>}
      {broke && (
        <div className="broke">
          <p>{t.money.broke}</p>
          <button className="btn primary" onClick={() => actions.onPlay(cheapest, true)}>
            {t.money.freeGame(formatMoney(FREE_GAME_REWARD))}
          </button>
        </div>
      )}
      {dailyOpen && <DailyBanner onSolve={actions.onPuzzle} />}

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
          save={save}
          onClose={() => onOpenPlace(null)}
          actions={actions}
        />
      )}
    </section>
  );
}

function DailyBanner({ onSolve }: { onSolve: () => void }) {
  return (
    <div className="daily-banner">
      <div>
        <b>{t.daily.title}</b>
        <span>{t.daily.teaser(`+${formatMoney(DAILY_REWARD)}`)}</span>
      </div>
      <button className="btn primary small" onClick={onSolve}>{t.daily.solve}</button>
    </div>
  );
}

function PlaceSheet({ place, save, onClose, actions }: {
  place: PlaceId;
  save: SaveData;
  onClose: () => void;
  actions: CityActions;
}) {
  const opponents = OPPONENTS.filter((o) => o.place === place);
  const furnitureCount = FURNITURE.filter((f) => save.owned.includes(f.id)).length;
  const homeLevel = Math.min(t.shop.homeDescriptions.length - 1, Math.ceil(furnitureCount / 2));
  let description = t.city.descriptions[place];
  if (place === 'home') description = t.shop.homeDescriptions[homeLevel];

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label={t.places[place]} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <img className="sheet-art" src={BUILDING_ART[place]} alt="" draggable={false} />
        <div className="sheet-head">
          <h2>{t.places[place]}</h2>
          <button className="btn ghost small" onClick={onClose}>{t.city.close}</button>
        </div>
        <p className="sheet-desc">{description}</p>

        {place === 'home' && <HomeContent save={save} actions={actions} />}
        {place === 'hall' && <TournamentCard save={save} actions={actions} />}
        {place === 'station' && (
          <p className="sheet-locked">{save.cityFinalWon ? t.tournament.stationOpen : t.city.lockedText.station}</p>
        )}

        {opponents.map((o) => (
          <OpponentCard key={o.id} opponent={o} save={save} actions={actions} />
        ))}

      </div>
    </div>
  );
}

function HomeContent({ save, actions }: { save: SaveData; actions: CityActions }) {
  const solved = save.dailySolved === todayKey();
  return (
    <>
      <EloCard save={save} />

      <div className="daily-banner in-home">
        <div>
          <b>{t.daily.title}</b>
          <span>{solved ? t.daily.solved : t.daily.teaser(`+${formatMoney(DAILY_REWARD)}`)}</span>
        </div>
        <button className={`btn ${solved ? '' : 'primary'} small`} onClick={actions.onPuzzle}>{t.daily.solve}</button>
      </div>

      <h3 className="sheet-sub">{t.shop.furnitureTitle}</h3>
      <ul className="shop-list">
        {FURNITURE.map((f) => {
          const owned = save.owned.includes(f.id);
          return (
            <li key={f.id} className={owned ? 'owned' : ''}>
              <span>{t.shop.furniture[f.id]}</span>
              {owned ? (
                <span className="shop-owned">{t.shop.owned}</span>
              ) : (
                <button className="btn small" disabled={!canAfford(save, f.price)} onClick={() => actions.onBuyItem(f.id, f.price)}>
                  {t.shop.buy(formatMoney(f.price))}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <h3 className="sheet-sub">{t.shop.themesTitle}</h3>
      <ul className="shop-list">
        {BOARD_THEMES.map((th) => {
          const owned = th.price === 0 || save.owned.includes(th.id);
          const inUse = save.boardTheme === th.id;
          return (
            <li key={th.id}>
              <span className="theme-name">
                <span className="theme-swatch" style={{ background: `linear-gradient(135deg, ${th.light} 50%, ${th.dark} 50%)` }} />
                {t.shop.themes[th.id]}
              </span>
              {inUse ? (
                <span className="shop-owned">{t.shop.inUse}</span>
              ) : owned ? (
                <button className="btn small" onClick={() => actions.onSelectTheme(th.id)}>{t.shop.use}</button>
              ) : (
                <button className="btn small" disabled={!canAfford(save, th.price)} onClick={() => actions.onBuyItem(th.id, th.price)}>
                  {t.shop.buy(formatMoney(th.price))}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <button className="btn ghost small test-link" onClick={actions.onTest}>{t.home.testGame}</button>
      <p className="hint center">{t.money.virtual}<br />{t.rating.notice}</p>
    </>
  );
}

function TournamentCard({ save, actions }: { save: SaveData; actions: CityActions }) {
  const T = CITY_TOURNAMENT;
  const state = save.tournament;

  return (
    <article className="opponent-card tournament">
      <div className="opponent-head">
        <div className="opponent-meta">
          <p className="opponent-name">{t.tournament.title}</p>
          <p className="opponent-place">{t.tournament.intro}</p>
        </div>
      </div>
      <div className="tour-facts">
        <span>{t.tournament.entryFee} <b>{formatMoney(T.entryFee)}</b></span>
        <span>{t.tournament.prize} <b>{formatMoney(T.prize)}</b></span>
      </div>
      <p className="reputation">{t.tournament.rules}</p>
      <div className="tour-field">
        <span className="strength">{t.tournament.field}</span>
        {T.field.map((id) => {
          const o = opponentById(id)!;
          return <span key={id} className="tour-player"><Portrait color={o.avatar.color} sprites={OPPONENT_ART[id]} size={22} />{t.opponents[id].name}</span>;
        })}
      </div>

      {save.cityFinalWon && <p className="tour-status win">{t.tournament.champion}</p>}

      {state ? (
        <>
          <p className="tour-status">
            {t.tournament.next(
              state.tiebreak ? t.tournament.tiebreak : t.tournament.roundNames[state.round],
              t.opponents[state.opponentId].name,
            )}
          </p>
          <DossierRow opponent={opponentById(state.opponentId)!} save={save} actions={actions} stake={T.entryFee} />
          <button className="btn primary big" onClick={actions.onPlayTournament}>{t.tournament.play}</button>
        </>
      ) : (
        <button
          className="btn primary big"
          disabled={!canAfford(save, T.entryFee)}
          onClick={actions.onEnterTournament}
        >
          {canAfford(save, T.entryFee) ? t.tournament.enter(formatMoney(T.entryFee)) : t.money.tooExpensive}
        </button>
      )}
    </article>
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

/** Dossier kaufen oder, wenn gekauft, anzeigen */
function DossierRow({ opponent: o, save, actions, stake }: { opponent: Opponent; save: SaveData; actions: CityActions; stake: number }) {
  if (save.dossiers.includes(o.id)) {
    return <p className="dossier"><b>{t.shop.dossierTitle}:</b> {t.opponents[o.id].dossier}</p>;
  }
  const price = dossierPrice(stake);
  return (
    <button className="btn ghost small dossier-btn" disabled={!canAfford(save, price)} onClick={() => actions.onBuyDossier(o, price)}>
      {t.shop.dossierBuy(formatMoney(price))}
    </button>
  );
}

function OpponentCard({ opponent: o, save, actions }: {
  opponent: Opponent;
  save: SaveData;
  actions: CityActions;
}) {
  const text = t.opponents[o.id];
  const rec = recordOf(save, o.id);
  const range = knownRange(o, rec.games, save.dossiers.includes(o.id));
  const affordable = canAfford(save, o.stake);

  return (
    <article className="opponent-card">
      <div className="opponent-head">
        <Portrait color={o.avatar.color} sprites={OPPONENT_ART[o.id]} size={52} />
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
      <DossierRow opponent={o} save={save} actions={actions} stake={o.stake} />
      <button className="btn primary big" disabled={!affordable} onClick={() => actions.onPlay(o, false)}>
        {affordable ? t.money.playFor(formatMoney(o.stake)) : t.money.tooExpensive}
      </button>
    </article>
  );
}
