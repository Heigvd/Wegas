import { CommonTranslations } from './definitions';

export const commonTranslationsFR: CommonTranslations = {
  plzChooseValue: 'Faites un choix',
  newChanges: 'Nouveaux changements!',
  changesNotSaved: 'Changements non sauvegardés!',
  changesSaved: 'Changement sauvegardés',
  changesWillBeLost: 'Les modifications vont être perdues.',
  areYouSure: 'Êtes-vous sûr de vouloir continuer?',
  whatDoYouWantToDo: 'Que voulez-vous faire',
  loading: 'Chargement',
  loadingFiles: 'Chargement des fichiers',
  someWentWrong: 'Quelque chose a mal tourné',
  accept: 'Accepter',
  cancel: 'Annuler',
  delete: 'Supprimer',
  reset: 'Réinitialiser',
  restart: 'Recommencer',
  save: 'Sauvegarder',
  doNotSave: 'Ne pas sauvegarder',
  edit: 'Editer',
  duplicate: 'Dupliquer',
  close: 'Fermer',
  add: 'Ajouter',
  filter: 'Filtrer',
  empty: 'Vide',
  forceDelete: 'Forcer à supprimer',
  seeChanges: 'Voir les changements',
  buildingWorld: 'Le monde se construit!',
  features: 'Fonctionnalités',
  language: 'Langue',
  deepSearch: 'Recherche approfondie',
  addVariable: 'Ajouter une variable',
  role: "Rôle de l'utilisateur",
  header: {
    hide: "Masquer l'en-tête",
    show: "Affiche  l'en-tête",
    restartGame: 'Recommencer le jeu (appliqué à tous les scénaristes)',
    restartRealGame:
      'ATTENTION, vous êtes sur le point de redémarrer une vraie partie. Toutes les équipes seront remises à zéro.',
    resetLayout: 'Réinitialiser mise en page',
    notifications: 'Notifications',
    teams: 'Equipes',
    addExtraTestPlayer: 'Ajouter un joueur de test',
  },
  noContent: 'Aucun contenu',
  noSelectedTab: 'Aucun onglet selectionné',
  serverDown: 'Reconnexion...',
  serverOutaded:
    "Votre version de Wegas n'est plus a jour, veuillez rafraichir votre navigateur.",
  somethingIsUndefined: name => `${name} est indéfini`,
  authorizations: {
    authorize: 'Autoriser',
    refuse: 'Refuser',
    authorizationsText: 'Autorisations',
    authorizationNeeded: 'Autorization nécessaire',
    authorizationRefused:
      "Le composant ne peut pas être affiché car l'autorisation a été refusée",
    resetAllAuthorizations: 'Réinitialiser toutes les autorisations',
    authorizations: {
      allowExternalUrl: {
        label: "Autoriser l'acces aux URLs externes",
        description:
          "Vous acceptez d'exposer votre adresse IP à d'autres sites web afin que Wegas puisse obtenir des ressources externes.",
      },
    },
  },
  qrCode: {
    notAuthorizedToUseCamera : "L'accès à la camera n'est pas autorisé",
    tabSetting: "Vérifiez si vous avez bloqué la caméra (icône de la caméra dans la barre d'adresse)",
    iOSSettingsHint: (navigator: string) => `Vérifiez les réglages de votre iPad/iPhone (Réglages / ${navigator})`,
    androidSettingsHint: (navigator: string) => `Vérifiez les réglages de votre téléphone/tablette (Paramètres / Applications / ${navigator} / Autorisations / Appareil Photo`
  },
};
