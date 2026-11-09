# Pawn to King

Ein Schach-Karrierespiel als Web-App. Das Design-Dokument liegt unter [`docs/game-design.md`](docs/game-design.md),
die Lizenzhinweise unter [`docs/lizenzen.md`](docs/lizenzen.md).

## Aktueller Stand

Schritt 1: eine spielbare Partie gegen einen Computergegner.
Schritt 2: eigene Engine mit einstellbarer Stärke und menschlichen Fehlern, siehe [`docs/engine.md`](docs/engine.md).
Schritt 3: eine komplette Partie um Spielgeld gegen einen Gegner.
Schritt 4: Elo, verdeckte Gegnerstärke mit Enthüllung und fünf Gegner mit Persönlichkeit.
Schritt 5: klickbare Stadtkarte in Papierkarten-Optik (`src/components/CityMap.tsx`).
Schritt 6: Tipps, Tagesaufgabe, Einkäufe und das Stadtturnier.
Schritt 7 (begonnen): Klänge per Web Audio mit Stummschalter; Stadtkarte und Heinz im neuen Grafikstil, siehe [`docs/grafik.md`](docs/grafik.md).

**Debug-Menü:** fünfmal schnell auf „Pawn to King“ oben tippen oder `?debug` an die Adresse hängen.
Dann gibt es einen Käfer-Knopf mit Geld, Elo, Tagesaufgabe, Stadtfinale und Zurücksetzen.

**Tipps, Tagesaufgabe, Einkäufe, Turnier (Startwerte)**

- Tipps in Geldpartien, Preis als Anteil am Einsatz (mind. 1 €), höchstens 3 pro Partie, in der Testpartie gratis:
  Warnung 5 % (prüft den nächsten Zug vor dem Ausführen), Hinweis 10 % (markiert die wichtige Figur),
  Bester Zug 20 % (Pfeil mit kurzer Erklärung), Rettung 35 % (nimmt den letzten Zug samt Antwort zurück).
- Sieg ohne Tipps: Bonus von 25 % des Einsatzes. Mit Tipps steigt die Elo nur zu einem Viertel, Verluste zählen voll.
- Tagesaufgabe: jeden Tag ein Matt in 1 (selbst erstellt, `src/game/puzzles.ts`), Belohnung 15 €.
- Wohnung: Einrichtung kaufen (verändert die Beschreibung) und Brett-Stile (Walnuss, Schiefer).
- Dossier über einen Gegner: 25 % des Einsatzes, zeigt seinen Spielstil und eine engere Stärke-Spanne.
- Stadtturnier in der Turnierhalle: ab Elo 900, Startgeld 150 €, Preisgeld 1.000 €, Halbfinale und Finale im K.-o.-System,
  Blitz-Stechen bei Remis, keine Tipps. Der Sieg öffnet den Bahnhof.

**Stadtkarte**

- Selbst gezeichnete Vektorkarte mit Park, Café Matt, Schachclub, Turnierhalle, Wohnung und Bahnhof.
  Platzhalter ohne echte Stadt, bis feststeht, welche Stadt zuerst kommt.
- Tippe auf einen Ort, die eigene Figur läuft über die Straßen dorthin, dann öffnet sich der Ort von unten.
- Gegner stehen als kleine Gesichter vor ihren Gebäuden. Gesperrte Orte sind grau mit Schloss und Grund
  (Club ab Elo 1000, Turnierhalle „Bald“, Bahnhof nach dem Stadtfinale).
- Die Wohnung zeigt Elo, Bilanz und die freie Testpartie.

**Elo und Gegner (Startwerte)**

- Eigene Wertung je Format (Blitz, Schnell, ohne Uhr) und eine Gesamt-Elo, gewichtet nach Partien; ohne Uhr zählt halb.
  Start bei 800, die ersten 5 Partien „vorläufig“. Die Wertung ändert sich am Anfang schneller (K = 40, später 24 und 16).
- Die Stärke eines Gegners bleibt verborgen. Nach jeder Partie wird sie enthüllt, danach zeigt seine Karte eine Spanne,
  die mit jeder Partie enger wird, aber nie die genaue Zahl.
- Tagesform: Jeder Gegner schwankt von Tag zu Tag um bis zu ±60.
- Fünf erfundene Gegner in Park, Café Matt und Schachclub Weißer Turm, jeder mit eigener Bedenkzeit, Einsatz, Spielstil
  und Sprüchen. Der Club verlangt Elo 1000.
- Die Uhr des Gegners läuft bei 10 Min. dreifach und bei 15+10 fünffach beschleunigt: Er wartet kürzer, verliert aber die volle Denkzeit.

**Geld-Regeln (Startwerte)**

- Startguthaben 100 €. Die Einsätze reichen von 20 € im Park bis 2.000 € im Club.
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
| `src/game/` | Bedenkzeiten, Partie-Ergebnis, Gegner (`opponents.ts`), Elo (`rating.ts`), Geld und Bilanz (`career.ts`), Speichern (`storage.ts`), Tipps, Laden, Tagesaufgaben, Turnier |
| `src/components/` | Startseite, Partie-Bildschirm mit Brett und Uhren, freie Testpartie |
| `src/i18n/` | Alle Texte, getrennt vom Code |

Ein neuer Gegner muss nur `ChessEngine` umsetzen: Er bekommt die Stellung als FEN und liefert einen Zug wie `e2e4`.

## Spielen ohne Installation

Eine aktuelle Version zum Ausprobieren im Browser: https://claude.ai/artifact/Kj7vUBYaMCCAEnAGN4G5qm
