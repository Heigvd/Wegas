import { PeerReviewTranslations } from './definitions';

export const peerReviewTranslationsIT: PeerReviewTranslations = {
  orchestrator: {
    mainTitle: function (variableName) {
      return `Processo di revisione paritaria per "${variableName}"`;
    },
    includeEvicted:
      'Gli autori che non hanno inviati dati devono comunque ricevere qualcosa a valutare',
    state: {
      edition: {
        title: 'Modificazione',
        description: 'Gli autori modificano quello che sara giudicato tra pari',
        subDescription: 'Il processo non e ancora iniziato',
      },
      reviewing: {
        title: 'Esaminazione',
        description: 'Gli autori esaminano i loro pari',
        subDescription: 'È un primo passo del processo',
      },
      commenting: {
        title: 'Osservazione',
        description: 'Gli autori vengono a conoscenza del parere di loro pari',
        subDescription: 'Commentano queste revisioni',
      },
      completed: {
        title: 'Completato',
        description: 'Il processo di revisione e finito',
        subDescription:
          'Gli autori venivano a conoscenza dei commenti delle sue revisioni',
      },
    },
    properties: 'Proprietà',
    overview: "Visione d'insieme",
    reviews: 'Revisioni',
    comments: 'Commentari',
    charts: 'Tabelle',
    playerData: function (playerName) {
      return `Dati valutati da pari per il giocatore "${playerName}"`;
    },
    teamData: function (teamName) {
      return `Dati valutati da pari per la squadra "${teamName}"`;
    },
    goNextConfirmation:
      'Questa azione e irreversibile.<br />\nAvviare nonostante la fase successiva?',
    stats: {
      mean: 'media.',
      median: 'mediana.',
      sd: 'σ',
      bounds: 'limiti',
      basedOn: function (available, expected) {
        return `basato su ${available}/${expected} valori`;
      },
      avgWc: 'Numero medio delle parole',
      avgCc: 'Numero medio dei caratteri',
    },
    notAvailableYet: 'Non ancora disponibile',
  },
  global: {
    submit: 'inviare',
    confirmation:
      'Una volta inviate, queste dati non sarano piu modificabile!<br /> Inviare nonostante ?',
    save: 'Salvare',
  },
  tabview: {
    emptyness_message: 'Niente revisione ancora disponibile',
    toReviewTitle: 'Esaminare le sue pari',
    toReview: 'Presentazione',
    toCommentTitle: 'Revisione delle vostre presentazioni',
    toComment: 'Revisioni',
  },
  editor: {
    given: 'Considerato: ',
    number: 'nº',
    ask_your_feedback: 'Dare un feedback',
    your_feedback: 'Vostro feedback:',
    reviewer_feedback: 'Feedback ricevuto',
    ask_reviewer_feedback: '',
    ask_comment: 'Che cosa pensa del feedback ricevuto?',
    comment: 'Ciò che pensa del feedback ricevuto',
    author_comment: "Ciò che l'autore pensa del vostro feedback",
    noValueProvided: 'Non è stata fornita alcuna valutazione',
    didNotProvide: 'non ha fornito alcuna valutazione',
    didNotProvidePluralized: 'non hanno fornito alcuna valutazione',
    noTeamProvide: 'nessuna squadra ha fornito alcuna valutazione',
    noPlayerProvide: 'nessun gioccatore ha fornito alcuna valutazione',
  },
};
