import { PeerReviewTranslations } from './definitions';

export const peerReviewTranslationsFR: PeerReviewTranslations = {
  orchestrator: {
    mainTitle: function (variableName) {
      return `Processus d'évaluations croisées pour "${variableName}"`;
    },
    includeEvicted:
      "Les auteurs qui n'ont pas soumis de données à examiner doivent quand-même recevoir quelque chose à évaluer",
    state: {
      edition: {
        title: 'Édition',
        description: 'Les auteurs éditent ce qui sera examiné par les pairs',
        subDescription: "Le processus n'a pas encore commencé",
      },
      reviewing: {
        title: 'Revue par les pairs',
        description: 'Les auteurs évaluent leurs pairs',
        subDescription: "C'est la première étape du processus",
      },
      commenting: {
        title: 'Commentaires',
        description:
          'Les auteurs prennent connaissance des avis de leurs pairs',
        subDescription: 'Ils commentent ces avis',
      },
      completed: {
        title: 'Terminé',
        description: 'Le processus de révision est terminé',
        subDescription:
          'Les pairs prennent connaissance des commentaires qui ont été faits à propos de leurs avis',
      },
    },
    properties: 'Propriétés',
    overview: 'Aperçu',
    reviews: 'Feedbacks',
    comments: 'Commentaires',
    charts: 'Statistiques',
    playerData: function (playerName) {
      return `Informations revues par les pairs pour le joueur "${playerName}"`;
    },
    teamData: function (teamName) {
      return `Informations revues par les pairs pour l'équipe "${teamName}"`;
    },
    goNextConfirmation: {
      info: 'Cette action est irréversible.',
      question: "Êtes-vous sûr de vouloir passer à l'étape suivante ?",
    },
    stats: {
      mean: 'moy.',
      median: 'med.',
      sd: 'σ',
      bounds: 'bornes',
      basedOn: function (available, expected) {
        return `basé sur ${available}/${expected} valeurs`;
      },
      avgWc: 'Nombre moyen de mots',
      avgCc: 'Nombre moyen de caractères',
    },
    notAvailableYet: 'Pas encore disponible',
  },
  global: {
    submit: 'Valider',
    confirmation: {
      info:
        'Une fois validées, vous ne pourrez plus modifier ces informations.',
      question: 'Êtes-vous sûr de vouloir continuer ?',
    },
    save: 'Sauver',
  },
  tabview: {
    emptyness_message: "Aucune évaluation n'est actuellement visible",
    toReviewTitle: 'Évaluer vos pairs',
    toReview: 'Soumission',
    toCommentTitle: 'Avis concernant votre soumission',
    toComment: 'Avis',
  },
  editor: {
    given: 'Travail à évaluer: ',
    number: 'n°',
    ask_your_feedback: 'Donnez votre feedback',
    your_feedback: 'Votre feedback',
    reviewer_feedback: 'Le feedback reçu:',
    ask_reviewer_feedback: '',
    ask_comment: 'Que pensez vous du feedback reçu ?',
    comment: 'Ce que vous pensez du feedback reçu',
    author_comment: "Ce que l'auteur pense de votre feedback",
    noValueProvided: "Aucune évaluation n'a été fournie",
    didNotProvide: "n'a pas fourni d'évaluation",
    didNotProvidePluralized: "n'ont pas fourni d'évaluation",
    noTeamProvide: "aucune équipe n'a fourni d'évaluation",
    noPlayerProvide: "aucun joueur n'a fourni d'évaluation",
  },
};
