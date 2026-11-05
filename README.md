# Pawn to King

Ein Schach-Karrierespiel als Web-App. Das Design-Dokument liegt unter [`docs/game-design.md`](docs/game-design.md),
die Lizenzhinweise unter [`docs/lizenzen.md`](docs/lizenzen.md).

## Aktueller Stand

Schritt 1: eine spielbare Partie gegen einen einfachen Computergegner.

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
| `src/engine/` | Austauschbare Gegner-Schnittstelle `ChessEngine` und die einfache eigene Engine |
| `src/game/` | Bedenkzeiten und Partie-Ergebnis |
| `src/components/` | Partie-Bildschirm mit Brett und Uhren |
| `src/i18n/` | Alle Texte, getrennt vom Code |

Ein neuer Gegner muss nur `ChessEngine` umsetzen: Er bekommt die Stellung als FEN und liefert einen Zug wie `e2e4`.
