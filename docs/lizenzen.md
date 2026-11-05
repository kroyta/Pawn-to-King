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
