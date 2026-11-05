import { formatMoney } from '../game/format';
import type { Opponent } from '../game/opponents';
import { canAfford, FREE_GAME_REWARD, type SaveData } from '../game/wallet';
import { t } from '../i18n/de';

export function HomeScreen({ save, opponent, notice, onPlay, onTest }: {
  save: SaveData;
  opponent: Opponent;
  notice: string | null;
  onPlay: (free: boolean) => void;
  onTest: () => void;
}) {
  const text = t.opponents[opponent.id];
  const affordable = canAfford(save, opponent.stake);
  const { wins, draws, losses } = save.stats;

  return (
    <section className="home">
      {notice && <p className="notice">{notice}</p>}

      <h2>{t.home.challenge}</h2>
      <article className="opponent-card">
        <div className="opponent-head">
          <div className="avatar" aria-hidden>{opponent.initials}</div>
          <div>
            <p className="opponent-name">{text.name}</p>
            <p className="opponent-place">{text.place} · {opponent.timeControl.label}</p>
          </div>
        </div>
        <p className="bubble">„{text.intro}“</p>
        <div className="stake-row">
          <span className="stake-label">{t.money.stake}</span>
          <span className="stake-amount">{formatMoney(opponent.stake)}</span>
        </div>

        {affordable ? (
          <button className="btn primary big" onClick={() => onPlay(false)}>
            {t.money.playFor(formatMoney(opponent.stake))}
          </button>
        ) : (
          <>
            <p className="hint">{t.money.notEnough}</p>
            <button className="btn primary big" onClick={() => onPlay(true)}>
              {t.money.freeGame(formatMoney(FREE_GAME_REWARD))}
            </button>
          </>
        )}
      </article>

      <p className="stats">{t.stats(wins, draws, losses)}</p>

      <button className="btn ghost small test-link" onClick={onTest}>{t.home.testGame}</button>
      <p className="hint center">{t.money.virtual}</p>
    </section>
  );
}
