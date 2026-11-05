# Eigene Engine

Die Engine rechnet in einem Web Worker, damit die Seite beim Nachdenken nicht stockt.
Sie steckt hinter der Schnittstelle `ChessEngine` (`src/engine/types.ts`) und lässt sich austauschen.

## Aufbau

| Datei | Aufgabe |
| --- | --- |
| `fastChess.ts` | Schneller Zugriff auf die internen Funktionen von chess.js (etwa 100-mal schneller als die öffentlichen). Deshalb ist chess.js auf Version 1.4.0 gepinnt. |
| `evaluate.ts` | Bewertung: Material, Stellungstabellen, Läuferpaar, Königssicherheit, Mattführung im Endspiel |
| `search.ts` | Alpha-Beta-Suche mit Schlagzug-Verlängerung, Schach-Verlängerung, Killerzügen, Wiederholungserkennung und Zeitlimit. Bewertet **jeden** Zug der Stellung, nicht nur den besten. |
| `humanPlayer.ts` | Stärke-Profile und die menschliche Zugwahl |
| `think.ts`, `engine.worker.ts`, `humanEngine.ts` | Verbindung zum Web Worker |

## Wie der Gegner Fehler macht

Ein Mensch spielt selten Zufallszüge. Er übersieht etwas. Die Engine bildet das in zwei Stufen nach:

1. **Natürliche Ungenauigkeit:** Aus den Zügen, die nicht viel schlechter als der beste sind, wird gewichtet zufällig gewählt.
   Je schwächer der Gegner, desto gleichgültiger ist ihm der Unterschied (`temperature`). Schwache Gegner schlagen und
   geben gern Schach (`greed`).
2. **Echte Fehler:** Mit einer gewissen Wahrscheinlichkeit (`blunderChance`) spielt der Gegner einen Zug, der **auf den ersten
   Blick gut aussieht**, aber nach der Antwort Material kostet. Völlig sinnlose Züge, die eine Figur einfach hinstellen,
   kommen nicht vor. Wie groß ein Fehler sein darf, begrenzt `maxBlunder`: Anfänger verlieren auch mal die Dame,
   Experten höchstens einen Bauern.

Ein gefundenes Matt spielt jeder Gegner. Dazu kommt die Suchtiefe: Schwache Gegner rechnen 1–2 Halbzüge, starke 3.

## Stufen (Startwerte für die Tests)

| Stufe | Tiefe | temperature | blunderChance | maxBlunder | greed |
| --- | --- | --- | --- | --- | --- |
| ~400 | 1 | 140 | 30 % | 900 | 60 |
| ~800 | 2 | 80 | 16 % | 600 | 35 |
| ~1200 | 2 | 45 | 8 % | 350 | 15 |
| ~1600 | 3 | 22 | 3,5 % | 220 | 5 |
| ~2000 | 3 | 8 | 1 % | 120 | 0 |

Zwischenwerte werden interpoliert, sodass später jeder Gegner eine eigene Stärke wie 1130 haben kann.
Die Elo-Zahlen sind grobe Schätzungen und müssen in Tests mit echten Spielern geeicht werden.
Die gemessene Fehlerquote liegt unter `blunderChance`, weil es nicht in jeder Stellung einen verlockenden Fehler gibt.

## Rechenzeit

Höchstens 1,5 Sekunden pro Zug und nie mehr als etwa 1/40 der Restzeit. Die Suche vertieft schrittweise und nutzt bei
Zeitnot die letzte fertige Tiefe. Zusätzlich wartet der Gegner eine kurze Mindestzeit, damit er nicht unnatürlich schnell zieht.

## Stufen gegeneinander testen

```bash
npm run ladder -- 800 1200 10
```

Spielt 10 Partien zwischen zwei Stufen (abwechselnd mit Weiß) und gibt Punkte und Fehlerquote aus.
