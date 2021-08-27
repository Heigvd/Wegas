import { PeerReviewTranslations } from './definitions';

export const peerReviewTranslationsDE: PeerReviewTranslations = {
  orchestrator: {
    mainTitle: function (variableName) {
      return `Peer-Review-Prozess für "${variableName}"`;
    },
    includeEvicted:
      'Autoren, die keine Daten zur Begutachtung eingereicht haben, müssen noch etwas zur Bewertung erhalten',
    state: {
      edition: {
        title: 'Abfassung',
        description: 'Die Autoren editieren, was begutachtet wird',
        subDescription: 'Der Prozess hat noch nicht begonnen',
      },
      reviewing: {
        title: 'Peer-Review',
        description: 'Autoren bewerten ihre Kollegen',
        subDescription: 'Das ist der erste Schritt in diesem Prozess',
      },
      commenting: {
        title: 'Kommentare',
        description: 'Autoren lesen die Meinungen ihrer Kollegen',
        subDescription: 'Sie kommentieren diese Meinungen',
      },
      completed: {
        title: 'Abgeschlossen',
        description: 'Der Peer-Review-Prozess is abgeschlossen',
        subDescription:
          'Peers lesen die Kommentare, die über ihre Meinungen gemacht wurden',
      },
    },
    properties: 'Eigenschaften',
    overview: 'Überblick',
    reviews: 'Feedbacks',
    comments: 'Kommentare',
    charts: 'Statistiken',
    playerData: function (playerName) {
      return `Peer-Review-Informationen fûr den "${playerName}" Spieler`;
    },
    teamData: function (teamName) {
      return `Peer-Review-Informationen fûr das "${teamName}" Team`;
    },
    goNextConfirmation: {
      info: 'Diese Aktion ist nicht umkehrbar.',
      question:
        'Bist du sicher, dass du sie auf die nächste Stufe bringen willst?',
    },
    stats: {
      mean: 'Mittel..',
      median: 'Median',
      sd: 'σ',
      bounds: 'Grenzen',
      basedOn: function (available, expected) {
        return `auf ${available}/${expected} der Werte`;
      },
      avgWc: 'Durchschnittliche Wortzahl',
      avgCc: 'Durchschnittliche Zeichenzahl',
    },
    notAvailableYet: 'Noch nicht verfügbar',
  },
  global: {
    submit: 'einreichen',
    confirmation: {
      info:
        'Einmal validiert, können Sie diese Informationen nicht mehr ändern.',
      question: 'Sind Sie sicher, dass Sie fortfahren wollen?',
    },
    save: 'Speichern',
  },
  tabview: {
    emptyness_message: 'Derzeit ist keine Peer-Review sichtbar',
    toReviewTitle: 'Überprüfen Sie Ihre Kollegen',
    toReview: 'Einreichung',
    toCommentTitle: 'Hinweis zu Ihrer Einreichung',
    toComment: 'Hinweis',
  },
  editor: {
    given: 'Ihre überprüfte Zuweisung: ',
    given_author: 'Peer-Zuweisung zur Überprüfung: ',
    number: 'Nr. ',
    ask_your_feedback: 'Geben Sie Ihr Feedback',
    your_feedback: 'Ihr Feedback',
    reviewer_feedback: 'erhaltene Feedback',
    ask_reviewer_feedback: '',
    ask_comment: 'Was halten Sie von dem erhaltenen Feedback?',
    comment: 'Ce que vous pensez du feedback reçu',
    author_comment: 'Was Sie von dem erhaltenen Feedback halten',
    noValueProvided: 'Keine Auswertung vorhanden',
    didNotProvide: 'hat keine Bewertung abgegeben',
    didNotProvidePluralized: 'haben keine Bewertung abgegeben',
    noTeamProvide: 'kein Team hat eine Bewertung abgegeben',
    noPlayerProvide: 'kein Spieler hat eine Bewertung abgegeben',
  },
};
