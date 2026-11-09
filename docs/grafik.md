# Grafik: Weg zu einem eigenen Stil

Die selbst gezeichneten Vektorgrafiken (Stadtkarte, Gesichter) sind Platzhalter.
Ziel ist ein eigener, warmer Stil, der nicht nach Governor of Poker aussieht.

## Vorgehen

1. **Stilrichtung festlegen** anhand von Stilproben desselben Motivs (Café Matt mit Heinz).
2. **Einzelteile im gewählten Stil erzeugen** (KI-Bildgenerator, z. B. Canva):
   Kartenhintergrund, jedes Gebäude freigestellt, jeder Gegner freigestellt mit 3–4 Gesichtsausdrücken.
   So bleiben Orte im Code klickbar, gesperrte Orte lassen sich grau färben und die Figur kann laufen.
3. **Bedienelemente bleiben im Code**: Brett, Knöpfe, Tipp-Kacheln. Das Brett bleibt klar.
4. **Später** die Gegner von einem Illustrator nachzeichnen lassen, wenn das Spiel trägt.

## Stilproben (Canva, November 2026)

| Probe | Richtung | Canva |
| --- | --- | --- |
| A | Warmer Bilderbuch-Look (Gouache, Aquarell) | https://www.canva.com/M/MAHabIjVcgM |
| B | Flacher Retro-Poster-Stil mit fester Palette | https://www.canva.com/M/MAHabIsNyUw |
| C | Spielzeugstadt von schräg oben (isometrisch) | https://www.canva.com/M/MAHabALJzlc |

## Entscheidung und Stand

- **Stil C** (Spielzeugstadt von schräg oben) für die Gebäude. Figuren im selben Stil, freigestellt.
- Erzeugt mit Canva, Probe C als Vorlage für einen einheitlichen Stil. Die Bilder liegen in `src/assets/`
  (WebP, freigestellt). Canva dient nur als Werkzeug, gespeichert wird im Projekt.
- **Stadtkarte aus einem Bild** (`src/assets/city/map.webp`, 1064 × 1303): ein zusammenhängendes Stadtbrett mit allen
  sechs Orten, erzeugt mit den Einzelgebäuden als Vorlage. Tippflächen, Straßenknoten und Schilder liegen als
  Koordinaten in `src/components/CityMap.tsx`. Gesperrte Orte werden per Ausschnitt grau überlagert.
- Einzelgebäude (Park, Café Matt, Schachclub, Turnierhalle, Wohnung, Bahnhof) erscheinen oben im Fenster des Ortes.
- Alle fünf Gegner mit je vier Ausdrücken (neutral, freut sich, besorgt, nachdenklich) für das Porträt und einer
  Kartenfigur an ihrem Ort (`OPPONENT_ART` und `OPPONENT_MAP_SPOTS` in `src/game/art.ts`):
  Heinz sitzt am Steintisch im Park, Blitz-Jojo steht mit Schachuhr daneben, Marlene sitzt mit Tee vor dem Café,
  Gambit-Kevin lehnt an der Laterne, Albrecht steht auf der Treppe des Clubs.
- Neue Figurenblätter: `python3 -I scripts/process-sheet.py BLATT.png NAME` stellt die vier Ausdrücke frei.

## Canva: generieren ja, speichern nein

Das Canva-Konto wird mitgenutzt. Deshalb wird dort nichts gespeichert:

- Bilder werden mit Canva erzeugt.
- Zum Herunterladen dient das vorhandene Design „Arbeitsblatt Pawn to King – Spielgrafiken“ als Werkbank:
  Seiten anlegen, Bild einsetzen, die Vorschau (bis 600 px) herunterladen, danach die Änderung **verwerfen**.
  Größere Bilder werden in Kacheln zerlegt und wieder zusammengesetzt.
- Gespeichert wird nur im Projekt (`src/assets/`).

## Neue Grafiken verarbeiten

1. Bild im gleichen Stil erzeugen, einfarbiger heller Hintergrund, Figurenblätter mit Abstand zwischen den Figuren.
2. Bilder als PNG in einen Ordner legen (1.png, 2.png, ...).
3. `python3 scripts/process-art.py ORDNER` stellt frei, schneidet zu und speichert WebP in `src/assets/`.
   Die Reihenfolge der Seiten steht im Skript.

## Offen

- [x] Stilrichtung wählen
- [ ] Nutzungsrechte der KI-Bilder vor einer Veröffentlichung prüfen (siehe `lizenzen.md`)
