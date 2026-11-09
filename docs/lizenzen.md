# Lizenzhinweise

Stand: erster Prototyp (spielbare Partie gegen einen einfachen Computergegner).
Diese Liste ersetzt keine fachkundige Prüfung. Vor einer Veröffentlichung lassen wir alle Punkte prüfen.

## Genutzte Bausteine

| Baustein | Zweck | Lizenz | Hinweis |
| --- | --- | --- | --- |
| [React](https://react.dev) | Oberfläche | MIT | – |
| [react-chessboard](https://github.com/Clariity/react-chessboard) | Schachbrett | MIT | Copyright (c) 2022 Ryan Gregory |
| [chess.js](https://github.com/jhlywa/chess.js) | Schachregeln | BSD-2-Clause | – |
| [@fontsource/inter](https://fontsource.org/fonts/inter) | Schrift Inter, selbst gehostet | SIL Open Font License 1.1 | – |
| [Vite](https://vite.dev), [TypeScript](https://www.typescriptlang.org) | Werkzeuge beim Bauen | MIT / Apache-2.0 | Nicht Teil der ausgelieferten App-Logik |

## Eigene Engine

Die Engine ist selbst geschrieben. Die Stellungstabellen folgen der bekannten „Simplified Evaluation Function“
von Tomasz Michniewski (veröffentlicht im Chess Programming Wiki). Es sind einfache Zahlentabellen, die wir
eingetippt haben, kein fremder Code. Wir prüfen trotzdem vor dem Start, ob ein Hinweis nötig ist.

- [ ] Herkunft der Stellungstabellen prüfen lassen oder durch eigene Werte ersetzen

## Klänge

Alle Klänge werden im Browser per Web Audio erzeugt (`src/game/sound.ts`). Es gibt keine fremden Sounddateien.

## KI-Bilder

Stilproben wurden mit dem Bildgenerator von Canva erzeugt (siehe `grafik.md`).

- [ ] Nutzungsbedingungen von Canva für KI-Bilder in einem Spiel prüfen lassen

## Figurensatz

Der Prototyp nutzt vorerst die Figuren, die in react-chessboard mitgeliefert werden. Sie sehen aus wie der
klassische Cburnett-Satz. Laut Design-Dokument wollen wir den Cburnett-Satz aus den **Original-Dateien von
Wikimedia** einbinden. Wikimedia nennt dafür unter anderem BSD, Lichess führt den Satz als GPLv2+.

- [ ] Original-Dateien von Wikimedia einbinden und Herkunft hier festhalten
- [ ] Lizenz der Figuren vor dem Start prüfen lassen

## Bewusst noch nicht genutzt

- **Stockfish** (GPLv3): kommt erst später und nur auf einem Server. Eine im App-Store eingebaute Version wäre heikel.
- **Maia**, **Lichess-Aufgaben-Datenbank**: Lizenz vor der Nutzung prüfen.

## Spielgeld

Das Spielgeld bleibt rein virtuell und lässt sich weder kaufen noch auszahlen.
