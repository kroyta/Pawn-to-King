// Alle sichtbaren Texte liegen hier, getrennt vom Code.
export const de = {
  appTitle: 'Pawn to King',
  setup: {
    subtitle: 'Eine Partie gegen den Computer',
    timeControl: 'Bedenkzeit',
    color: 'Deine Farbe',
    white: 'Weiß',
    black: 'Schwarz',
    random: 'Zufall',
    start: 'Partie starten',
  },
  noClock: 'Ohne Uhr',
  you: 'Du',
  opponent: 'Computer',
  status: {
    yourTurn: 'Du bist am Zug',
    thinking: 'Gegner denkt nach …',
    check: 'Schach!',
  },
  actions: {
    resign: 'Aufgeben',
    confirmResign: 'Wirklich aufgeben?',
    yes: 'Ja',
    no: 'Nein',
    newGame: 'Neue Partie',
    rematch: 'Revanche',
  },
  promotion: 'Umwandeln in',
  result: {
    win: 'Gewonnen!',
    loss: 'Verloren',
    draw: 'Remis',
  },
  reason: {
    checkmate: 'durch Schachmatt',
    timeout: 'durch Zeitüberschreitung',
    resignation: 'durch Aufgabe',
    stalemate: 'durch Patt',
    threefold: 'durch dreifache Stellungswiederholung',
    fiftyMove: 'durch die 50-Züge-Regel',
    insufficient: 'durch ungenügendes Material',
    timeoutInsufficient: 'Zeit abgelaufen, aber dem Gegner fehlt Mattmaterial',
  },
} as const;

export const t = de;
