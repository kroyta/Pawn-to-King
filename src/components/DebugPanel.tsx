import type { SaveData } from '../game/career';
import { addElo, addMoney, clearTournament, freshSave, placeRival, resetDaily, toggleCityFinal } from '../game/debug';
import { formatMoney } from '../game/format';
import { overallRating } from '../game/rating';
import { t } from '../i18n/de';

/** Verstecktes Menü zum Testen: Geld, Elo und Fortschritt direkt ändern. */
export function DebugPanel({ save, onChange, onClose, onDisable }: {
  save: SaveData;
  onChange: (s: SaveData) => void;
  onClose: () => void;
  onDisable: () => void;
}) {
  const d = t.debug;
  const btn = (label: string, apply: (s: SaveData) => SaveData) => (
    <button className="btn small" onClick={() => onChange(apply(save))}>{label}</button>
  );
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet debug" role="dialog" aria-label={d.title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-head">
          <h2>{d.title}</h2>
          <button className="btn ghost small" onClick={onClose}>{t.city.close}</button>
        </div>
        <p className="sheet-desc">{d.state(formatMoney(save.balance), overallRating(save.ratings).value)}</p>

        <h3 className="sheet-sub">{d.money}</h3>
        <div className="debug-row">
          {btn('+100 €', (s) => addMoney(s, 100))}
          {btn('+1.000 €', (s) => addMoney(s, 1000))}
          {btn('+10.000 €', (s) => addMoney(s, 10000))}
          {btn(d.zero, (s) => addMoney(s, -s.balance))}
        </div>

        <h3 className="sheet-sub">Elo</h3>
        <div className="debug-row">
          {btn('−100', (s) => addElo(s, -100))}
          {btn('+100', (s) => addElo(s, 100))}
          {btn('+500', (s) => addElo(s, 500))}
        </div>

        <h3 className="sheet-sub">{d.progress}</h3>
        <div className="debug-row">
          {btn(d.resetDaily, resetDaily)}
          {btn(save.cityFinalWon ? d.finalOff : d.finalOn, toggleCityFinal)}
          {btn(d.clearTournament, clearTournament)}
          {btn(d.rival, (s) => placeRival(s))}
        </div>

        <h3 className="sheet-sub">{d.danger}</h3>
        <div className="debug-row">
          <button className="btn danger small" onClick={() => onChange(freshSave())}>{d.reset}</button>
          <button className="btn small" onClick={onDisable}>{d.hide}</button>
        </div>
      </div>
    </div>
  );
}
