# Pawn to King

Ein Schach-Karrierespiel als Web-App. Das Design-Dokument liegt unter [`docs/game-design.md`](docs/game-design.md),
die Lizenzhinweise unter [`docs/lizenzen.md`](docs/lizenzen.md).

## Aktueller Stand

Schritt 1: eine spielbare Partie gegen einen Computergegner.
Schritt 2: eigene Engine mit einstellbarer Stärke und menschlichen Fehlern, siehe [`docs/engine.md`](docs/engine.md).
Schritt 3: eine komplette Partie um Spielgeld gegen einen Gegner.

**Geld-Regeln (Startwerte)**

- Startguthaben 100 €. Der erste Gegner, Heinz Schachtel im Park, spielt 10 Min. um 20 €.
- Der Einsatz wird beim Start einbehalten. Sieg: Einsatz zurück plus 20 €. Remis: Einsatz zurück. Niederlage, Aufgabe oder Abbruch: Einsatz weg.
- Wer die Seite mitten in der Partie schließt oder neu lädt, verliert den Einsatz.
- Reicht das Geld nicht, gibt es eine Gratis-Partie: kein Risiko, ein Sieg bringt 5 €.
- Der Spielstand liegt im Browser (localStorage). Die freie Testpartie spielt ohne Geld und kann den Spielstand zurücksetzen.

- Korrekte Schachregeln über chess.js (Rochade, en passant, Umwandlung, Patt, Remisregeln)
- Ziehen per Drag & Drop oder Antippen, mit Anzeige der möglichen Zielfelder
- Zwei Schachuhren: 3 Min., 3+2, 10 Min., 15+10 oder ohne Uhr
- Anzeige des Partieendes mit Grund (Matt, Zeit, Aufgabe, Patt, Wiederholung, 50 Züge, Material)

## Starten

Voraussetzung: [Node.js](https://nodejs.org) ab Version 20.19.

```bash
npm install
npm run dev
```

Dann im Browser `http://localhost:5173` öffnen. Vite zeigt auch eine „Network“-Adresse, über die man die
Partie im selben WLAN am Handy öffnen kann.

## Aufbau

| Ordner | Inhalt |
| --- | --- |
| `src/engine/` | Austauschbare Gegner-Schnittstelle `ChessEngine` und die eigene Engine |
| `scripts/` | Testwerkzeuge, z. B. Stufen gegeneinander spielen lassen |
| `src/game/` | Bedenkzeiten, Partie-Ergebnis, Gegner, Geld (`wallet.ts`) und Speichern (`storage.ts`) |
| `src/components/` | Startseite, Partie-Bildschirm mit Brett und Uhren, freie Testpartie |
| `src/i18n/` | Alle Texte, getrennt vom Code |

Ein neuer Gegner muss nur `ChessEngine` umsetzen: Er bekommt die Stellung als FEN und liefert einen Zug wie `e2e4`.

## Spielen ohne Installation

Eine aktuelle Version zum Ausprobieren im Browser: https://claude.ai/artifact/Kj7vUBYaMCCAEnAGN4G5qm
