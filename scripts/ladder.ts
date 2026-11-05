import { Chess } from 'chess.js';
import { think } from '../src/engine/think';
import { profileForElo } from '../src/engine/humanPlayer';
import { boardResult } from '../src/game/result';
const elos = process.argv.slice(2).map(Number);
const [A, B, N] = [elos[0], elos[1], elos[2] ?? 10];
let score = 0, blunders = { [A]: 0, [B]: 0 }, moves = { [A]: 0, [B]: 0 }, t0 = performance.now();
for (let i = 0; i < N; i++) {
  const g = new Chess(); const hist: string[] = []; const white = i % 2 === 0 ? A : B;
  let r = null, n = 0;
  while (!(r = boardResult(g)) && n < 240) {
    const elo = (g.turn() === 'w') === (white === A) ? A : B;
    const res = think({ fen: g.fen(), history: hist, profile: profileForElo(elo), timeLeftMs: 60000 });
    moves[elo]++; if (res.kind === 'blunder') blunders[elo]++;
    hist.push(g.fen()); g.move({ from: res.uci.slice(0, 2), to: res.uci.slice(2, 4), promotion: res.uci[4] }); n++;
  }
  const aColor = white === A ? 'w' : 'b';
  score += !r || r.winner === null ? 0.5 : r.winner === aColor ? 1 : 0;
}
console.log(`${A} vs ${B}: ${score}/${N} für ${A}  Fehler/Zug ${A}: ${(blunders[A]/moves[A]).toFixed(2)} ${B}: ${(blunders[B]/moves[B]).toFixed(2)}  ${((performance.now()-t0)/(moves[A]+moves[B])).toFixed(0)}ms/Zug`);
