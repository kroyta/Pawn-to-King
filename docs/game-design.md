# Pawn to King: Game Design Dokument

Nov 4, 2026 · @Luca

## Kurzfassung

Ein witziges Schach-Karrierespiel: Du ziehst durch echte Städte, spielst um Spielgeld gegen schräge Figuren und arbeitest dich vom Park bis zum großen Turnier hoch. Das Vorbild für den Aufstieg ist Governor of Poker, Stil, Figuren und Namen sind aber eigenständig.

- **Zielgruppe:** Anfänger bis Vereinsspieler, weil sich die Gegner an die Spielstärke anpassen.
- **Besonderheit:** Neben dem Schach zählt die Frage, gegen wen sich der Einsatz lohnt, denn die genaue Stärke des Gegners bleibt verborgen.
- **Spielgeld:** Es bleibt rein virtuell. Man kann es nicht für echtes Geld kaufen oder auszahlen.
- **Rahmen:** Ein Entwickler, kein Budget, Bau mit Claude Pro und Claude Code.

## Spielablauf

Der Spieler verdient in Partien Geld und Elo, investiert beides in seinen Aufstieg und öffnet mit dem Stadtfinale die nächste Stadt.

&#91;embedded content: Spielablauf · von der Stadtkarte bis zur nächsten Stadt\]

Wer pleite ist, kommt über Gratis-Partien und Schachaufgaben wieder ins Spiel.

## Elo und Gegner

Die eigene Elo ist sichtbar, die genaue Elo des Gegners bleibt bis nach der Partie verborgen. So sieht man den Fortschritt, muss den Gegner aber weiter einschätzen.

| Situation | Was der Spieler sieht |
| --- | --- |
| Eigene Elo | Die genaue Zahl, am Anfang als „vorläufig“ markiert |
| Unbekannter Gegner | Nur Ruf, Auftreten und Einsatz |
| Gegner mit gekauften Infos | Eine Spanne, die mit mehr Infos enger wird |
| Bereits gespielter Gegner | Eine genauere Spanne, nie die genaue Zahl vor der Partie |
| Nach der Partie | Die genaue Elo des Gegners als Enthüllung |

**Regeln für die Anpassung**

- **Einstufung:** Zwei bis drei lockere Partien in der Story ergeben die Startwertung, ohne sichtbaren Test.
- **Feste Gegner:** Bekannte Figuren behalten ihre Stärke. Die Anpassung läuft darüber, dass neue Gegner in passender Stärke auftauchen.
- **Abstufung nach Ort:** Der Park liegt unter dem Niveau des Spielers, das Café etwa gleichauf, Club und Turnierhalle darüber.
- **Tagesform:** Gegner schwanken etwas, sodass auch ein bekannter Gegner nie ganz berechenbar ist.
- **Normale Elo:** Die Elo steigt und fällt nach jeder Partie wie auf chess.com, am Anfang schneller. Absichtlich zu verlieren lohnt sich nicht, weil man dabei den Einsatz verliert.
- **Eigene Wertung:** Die Zahl ist keine FIDE- oder Online-Elo, und das Spiel sagt das klar.
- **Partien mit Tipps:** Sie erhöhen die Elo kaum oder gar nicht, damit die Einstufung stimmt.

**Bedenkzeiten**

Es gibt je eine Elo für Blitz (3 Min. und 3+2), Schnellschach (10 Min. und 15+10) und Partien ohne Uhr. Dazu kommt eine Gesamt-Elo, die sich gewichtet nach der Zahl der Partien aus den einzelnen Werten ergibt. Die Gegner richten sich nach der Elo des jeweiligen Formats. In der Gesamt-Elo zählen Partien ohne Uhr weniger. Die Bedenkzeit gehört zur Persönlichkeit des Gegners.

| Format | Typischer Einsatz | Gegneruhr |
| --- | --- | --- |
| 3 Min. und 3+2 | Hektische Zocker, schnelle Geldpartien | Echtzeit, mit kurzen Denkzeiten |
| 10 Min. | Normaler Standard | Etwa dreifach beschleunigt |
| 15+10 | Selten, wichtige Duelle und Stadtfinale | Etwa fünffach beschleunigt |
| Ohne Uhr | Gemütliche Gegner, gut für Anfänger | Keine Uhr, 2–5 Sekunden Pause |

Die Uhr des Gegners verliert die volle gespielte Denkzeit, nur die Anzeige läuft schneller ab. Die eigene Uhr läuft immer normal. Die Faktoren sind Startwerte für die Tests.

## Geld und Einsätze

Jeder Gegner hat einen fixen, sichtbaren Einsatz statt Quoten. Stärkere Gegner und bessere Orte bringen mehr ein, und schwache Gegner lohnen sich auf Dauer nicht.

| Ort | Beispiel-Einsatz |
| --- | --- |
| Park | 20 € |
| Café | 200 € |
| Schachclub | 2.000 € |

Die Beträge sind Platzhalter. Der Einsatz hängt nur ungefähr mit der Stärke zusammen, sodass es am selben Ort Schnäppchen und Fallen gibt.

**Ausgang einer Partie**

- **Sieg:** Man gewinnt den Einsatz.
- **Remis:** Man bekommt den Einsatz zurück.
- **Niederlage, Aufgabe oder Abbruch:** Man verliert den Einsatz.

**Schutz vor Farmen**

- Mehrmals besiegte Gegner verdoppeln den Einsatz oder lehnen ab.
- Startgelder, Reisen und Training werden mit der Zeit deutlich teurer.

**Wenn das Geld ausgeht**

Pleite ist nicht das Ende, soll sich aber spürbar anfühlen. Als Sicherheitsnetz gibt es Gratis-Partien für sehr wenig Geld, Schachaufgaben und einen Tagesbonus in Form einer Tagesaufgabe.

**Wofür man das Geld ausgibt**

| Kategorie | Beispiele | Nutzen |
| --- | --- | --- |
| Zugang | Startgelder, Reisen | Neue Gegner und Städte |
| Informationen | Gegner-Dossier, Tipp vom Barkeeper | Bessere Einschätzung |
| Training | Trainerstunden, Eröffnungsbücher, Partieanalyse | Echtes Besserwerden |
| Besitz | Wohnung, Stammcafé, später ein eigener Club | Sichtbarer Aufstieg, der Club bringt passives Einkommen |
| Stil | Figuren, Bretter, Kleidung | Status und Sammelspaß |

**Wohnung und Schachclub**

- **Wohnung:** Man kann sie kaufen und ausbauen. Sie zeigt den Aufstieg und bringt kein Geld ein.
- **Schachclub:** Er ist teuer und bringt passives Geld ein, solange man nicht spielt.
- **Obergrenze:** Das Club-Einkommen sammelt sich nur bis zu einem Höchstbetrag und muss abgeholt werden. So bleibt das Spielen die wichtigste Geldquelle.

## Tipps und Turniere

Tipps lassen sich mit Spielgeld kaufen und machen auch Gegner über dem eigenen Niveau schlagbar. Turniere sind dagegen die echte Prüfung ohne Live-Hilfe.

| Hilfe | Inhalt | Preis |
| --- | --- | --- |
| Warnung | „Dein letzter Zug könnte ein Fehler sein“ | Günstig |
| Hinweis | Welche Figur wichtig ist, oder dass eine Taktik in der Stellung steckt | Mittel |
| Bester Zug | Der konkrete Zug mit kurzer Erklärung | Teuer |
| Rettung | Einen Zug zurücknehmen | Sehr teuer |

**Regeln für Tipps**

- Der Preis richtet sich als Prozentsatz nach dem Einsatz.
- Pro Partie gibt es nur wenige Tipps.
- Tipps erklären kurz das Warum, damit man dabei lernt.
- Wer ganz ohne Hilfe gewinnt, bekommt einen Bonus an Geld oder Ansehen.

**Turniere**

- **Format:** Vier bis acht Spieler im K.-o.-System, also zwei bis drei Partien, mit Speichern zwischen den Runden.
- **Risiko:** Startgeld und Preisgeld steigen von Stadt zu Stadt.
- **Stadtfinale:** Jede Stadt endet mit einem großen Turnier, dessen Sieg die nächste Stadt öffnet.
- **Hilfe:** Während der Partie gibt es keine Tipps. Zwischen den Runden kann man Dossiers und Trainerstunden kaufen.
- **Zugang:** Alle Orte, Gegner und Turniere sind für alle offen. Es gibt keine Mindest-Elo. Wer gegen starke Gegner bestehen will, investiert Geld: in Einsätze, Startgelder, Dossiers und Tipps. *(Entscheidung vom 9. Nov. 2026, ersetzt die frühere Mindest-Elo.)*

**Rivale**

Der Spieler erstellt sich selbst mit Name und Aussehen. Ein witziger Rivale taucht in jeder Stadt auf, merkt sich frühere Partien und gibt der Reise ein klares Ziel.

## Welt und Design

Das Herz des Spiels ist eine klickbare, illustrierte Stadtkarte in Papierkarten-Optik, die aufgeräumt bleibt und nicht zu voll wirkt. Die Partie ist dagegen hell und reduziert: viel Weißraum, ein klares Brett und ein Gegner mit Sprechblase. Man tippt auf ein Gebäude, und die eigene Figur läuft selbst dorthin.

- **Orte:** Park, Café, Schachclub, Turnierhalle, die eigene Wohnung und der Bahnhof zur nächsten Stadt.
- **Sichtbarer Aufstieg:** Gesperrte Orte erkennt man sofort, und die Wohnung wird mit der Zeit schöner.
- **Lebendige Welt:** Gegner stehen vor den Gebäuden, und der Rivale taucht unterwegs auf.
- **Städte:** Echte Städte mit Wahrzeichen als Kulisse, aber erfundene Lokale wie „Café Matt“ und erfundene Figuren. Echte Personen und bekannte Lokale kommen nicht vor.
- **Humor:** Wir machen uns über die Figuren lustig, nicht über Nationalitäten.

**Designregeln**

1. **Brett bleibt klar:** Der Humor gehört rund um das Brett. Figuren und Felder müssen auch am Handy und unter Zeitdruck lesbar sein.
2. **Gegner sind die Stars:** Sie reagieren mit wenigen Gesichtsausdrücken und kurzen Sprüchen auf die Partie.
3. **Gefühl durch Details:** Zugklang, Münzklimpern und kleine Animationen machen viel aus und kosten wenig.
4. **Eigener Stil:** Das Spiel darf nicht wie eine Kopie von Governor of Poker wirken.

**Grafik-Produktion:** Die Oberfläche bauen wir selbst. Es ist kein Grafik-Budget vorgesehen. Die Richtung ist hell und aufgeräumt: warmes Weiß, klare Schrift, freundliche Knöpfe und freigestellte Gegner als selbst gezeichnete Vektorfiguren, die direkt auf dem Brett stehen. Die Stadtkarte bleibt vorerst ein KI-Bild als Platzhalter, dessen Nutzungsrechte wir prüfen.

**Aktueller Stil des Partie-Bildschirms** (Stand: [Entwurf „Partie neu 2“](https://claude.ai/artifact/SKQatkz5udhKD5PauJg8zD))

| Element | Vorgabe |
| --- | --- |
| Schrift | Inter, Gewichte 500 bis 800 |
| Hintergrund und Text | #FFFDF8 und #16323F, Nebentext #5C6F78 |
| Brett | Felder #F3F0E4 und #8AAE78, letzter Zug #F8E78F und #D9C95B, Breite wie der Bildschirm |
| Figuren | Klassischer Cburnett-Satz |
| Gegner | Freigestellte Vektorfigur, die direkt auf der Brettkante steht, mit Sprechblase daneben |
| Akzente | Rot #BE4128, Gold #E9A81C, Petrol #2F8A9C |
| Tipp-Knöpfe | Weiße Kacheln mit farbigem Icon, noch nicht final |

**Sprache:** Das Spiel startet auf Deutsch. Alle Texte liegen von Anfang an getrennt vom Code, damit sich Sprachen leicht ergänzen lassen.

## Technik

Das Spiel startet als Web-App für Handy und Computer und nutzt zunächst eine eigene Engine. Stockfish kommt erst für die stärksten Gegner dazu, und zwar auf einem Server.

| Baustein | Entscheidung | Grund |
| --- | --- | --- |
| Plattform | Web zuerst, App-Stores später | Schnell testen und teilen, ohne Store-Prüfung und -Gebühren |
| Normale Gegner | Eigene Engine auf dem Gerät | Keine Serverkosten, Persönlichkeit und Fehler lassen sich gut steuern |
| Sehr starke Gegner | Stockfish auf einem Server, erst bei Bedarf | Für Meisterniveau zu aufwendig selbst zu bauen |
| Engine-Anbindung | Austauschbare Schnittstelle | Spätere Engines ohne großen Umbau |
| Spielstände | Günstiger Dienst, sobald nötig | Fortschritt auf mehreren Geräten, weniger Schummeln |

**Schachbrett:** Für das Brett planen wir react-chessboard unter MIT-Lizenz ein. Es soll vertraut und klassisch wirken, ähnlich wie auf großen Schachseiten. Als Figuren planen wir den klassischen Cburnett-Satz ein. Wikimedia nennt dafür unter anderem BSD, Lichess führt ihn als GPLv2+, deshalb nehmen wir die Original-Dateien von Wikimedia und prüfen die Lizenz vor dem Start.

**Lizenzen**

- **Stockfish:** Es steht unter der GPLv3. Läuft es nur auf dem Server, muss der App-Code nach verbreiteter Lesart nicht offengelegt werden. Im Apple App Store wäre eine eingebaute Version heikel.
- **Weitere Bausteine:** Vor der Nutzung prüfen wir jede Lizenz. Das betrifft etwa Maia, die Aufgaben-Datenbank von Lichess und jeden fremden Figurensatz.
- **Vor dem Start:** Die Lizenzfragen lässt du vor einer Veröffentlichung fachkundig prüfen.

**Kosten:** Sie hängen vor allem davon ab, wie viele gleichzeitig auf dem Server spielen. Die erste grobe Schätzung liegt bei etwa 50–150 € pro Monat für 1.000 gleichzeitige Spieler und muss noch gemessen werden.

## Erste Version und nächste Schritte

Die erste Version umfasst eine Stadt mit etwa fünf Gegnern und einem kleinen Turnier. So lässt sich früh prüfen, ob die Idee Spaß macht, bevor weitere Inhalte entstehen.

**Enthalten**

- Klickbare Stadtkarte mit Park, Café, Club, Turnierhalle und Wohnung
- Partien mit fixen Einsätzen und allen Bedenkzeiten
- Eigene Engine mit etwa fünf unterschiedlichen Gegnern
- Sichtbare Elo, verdeckte Gegnerstärke und Enthüllung nach der Partie
- Tipps, Tagesaufgabe, Gratis-Partien und einige Dinge zum Kaufen

**Später**

- Weitere Städte, der Rivale in voller Länge und der eigene Schachclub
- Stockfish für sehr starke Gegner, Spielstände auf dem Server
- Weitere Sprachen und die App-Stores

**Bau-Reihenfolge**

1. Spielbares Schachbrett mit Regeln und Uhr
2. Eigene Engine mit einstellbarer Stärke und glaubwürdigen Fehlern
3. Eine komplette Partie um Einsatz gegen einen Gegner
4. Elo, Enthüllung und mehrere Gegner mit Persönlichkeit
5. Stadtkarte und einfache Grafiken
6. Tipps, Tagesaufgabe, Einkäufe und Turnier
7. Feinschliff bei Grafik und Klang, dann Tests mit anderen

**Was die Tests klären sollen**

- Macht es Spaß, Gegner einzuschätzen und den Einsatz abzuwägen?
- Fühlen sich die Gegner menschlich an, auch wenn sie Fehler machen?
- Lohnt es sich, Tipps zu kaufen, ohne dass Siege gekauft wirken?
- Wollen die Spieler nach einer Partie direkt die nächste starten?

## Offene Fragen

- [ ] Ist der Arbeitstitel „Pawn to King“ als Name frei? Das prüfen wir vor einer Veröffentlichung.
- [ ] Welche Stadt kommt zuerst?
- [ ] Wie sieht der Cartoon-Stil genau aus? Dazu sollten wir Entwürfe bauen und vergleichen.
- [ ] Welche Zahlen funktionieren für Einsätze, Tipp-Preise und Elo-Änderungen?
- [ ] Wird die Gegner-Elo nach jeder Partie enthüllt oder nur nach einem Sieg?
- [ ] Wie genau läuft der Fortschritt im Schachaufgaben-Teil ab, und passt die Lichess-Datenbank von der Lizenz her?
- [ ] Welches Geschäftsmodell passt später? Geld für Spielgeld oder Tipps schließen wir aus.
