/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { IGameModel } from 'wegas-ts-api';
import { WegasTranslations } from './I18nContext';

export const fr: WegasTranslations = {
  formatDate: (timestamp: number) => new Date(timestamp).toLocaleDateString('fr'),
  pleaseProvideData: 'Merci de remplir tous les champs',
  cancel: 'annuler',
  agree: 'Accepter',
  confirm: 'confirmer',
  emailAddress: 'adresse e-mail',
  emailAddressNotValid: 'adresse e-mail invalide',
  emailShort: 'E-Mail',
  pleaseEnterId: 'Veuillez entrer un identifiant',
  username: "nom d'utilisateur",
  emailOrUsername: "e-mail ou nom d'utilisateur",
  password: 'mot de passe',
  weakPassword: 'mot de passe trop faible',
  passwordConditions: {
    mustContain: 'Il doit contenir:',
    minChars: 'Min. 8 caractères (min. 2 différents)',
    minCaps: 'Min. 1 MAJUSCULE',
    minNums: 'Min. 1 nombre (0-9)',
  },
  password_again: 'confirmation du mot de passe',
  passwordsMismatch: 'les mots de passe ne correspondent pas',
  login: 'connexion',
  forgottenPassword: 'mot de pass oublié ?',
  createAnAccount: 'créer un compte',
  sendMePassword: 'Envoyez-moi un nouveau mot de passe',
  unverifiedEmail: 'e-mail non vérifié',
  verified: org => `identitée verifiée (${org})`,
  verifyEmail: 'Cliquez ici pour vérifier votre mot de passe',
  firstname: 'prénom',
  missingFirstname: 'Veuillez entrer votre prénom',
  lastname: 'nom de famille',
  missingLastname: 'Veuillez entrer votre nom de famille',
  agreementDisclaimer: "L'utilisation de ce service implique que vous en acceptez",
  iAccept: "J'accepte",
  termOfUse: 'les conditions générales',
  and: 'et',
  dataPolicy: 'la politique de gestion des données',
  termOfUseUrl: 'https://www.albasim.ch/en/terms-of-use/',
  dataPolicyUrl: 'https://www.albasim.ch/en/data-policy/',
  notAgreed: 'vous devez accepter les conditions générales et la politique de gestion des données',
  agreedTime: "A accepter les conditions d'utilisations le ",
  never: 'jamais',

  // settings
  editProfile: 'Édition du profile',
  viewProfile: 'Voir le profile',
  updatePassword: 'Mise à jour du mot de passe',

  passwordEditionImpossible: 'Vous ne pouvez pas mettre à jour votre mot de passe',

  // common
  copiedToClipboard: 'copié dans le presse papier',
  copyToClipboard: 'copier dans le presse papier',
  reconnecting: 'reconnexion en cours..',
  player: 'joueur',
  trainer: 'animateur',
  scenarist: 'scénariste',
  modeler: 'modeleur',
  admin: 'administrateur',
  search: 'recherche...',
  logout: 'déconnexion',
  changeLanguage: 'changer de langue',
  //
  Team: 'Team',
  failedToJoin: "Erreur durant la tentative de rejoindre l'équipe",
  retryToJoin: "Tenter de rejoindre à nouveau l'équipe",
  viewTeam: "Voir l'équipe",
  leaveGame: 'Quitter la partie',
  openGameAsPlayer: 'Jouer',
  spyPlayer: 'Espionner le joueur',
  joinGame: 'Rejoindre une partie',
  joinedOn: 'Rejoint le',
  //
  teamName: "nom de l'équipe",
  teamSize: 'taille',
  createTeam: 'créer une équipe',
  joinTeam: "Rejoindre l'équipe",
  joinOrCreateATeam: 'Vous pouvez rejoindre une équipe existante ou en créer une nouvelle',
  alreadyJoined: 'Vous avez déjà rejoint la partie',
  join: 'Rejoindre',
  accessKey: "clé d'accès",
  gameNotFound: "clé d'accès invalide",
  //
  Game: 'Partie',
  games: 'parites',
  allGames: 'Toutes les parties',
  archive: 'achiver',
  restore: 'restaurer',
  moveToTrash: 'mettre à la corbeille',
  finalDelete: 'supprimer définitivement',
  openGameAsTrainer: 'Animer la partie',
  spyGame: "Ouvrir le dashboard de la partie auquele l'utilisateur joue",
  //
  sortBy: 'trier par: ',
  createdBy: 'crée par',
  name: 'nom',
  date: 'date',
  //
  basedOnScenario: 'Scénario: ',
  Scenario: 'Scénario',
  scenario: 'scénario',
  playScenario: 'partie',
  createdOn: 'Créé le ',
  by: 'par',
  display: 'afficher: ',
  liveGames: 'actuelles',
  archivedGames: 'archivées',
  deletedGames: 'suprimées',
  liveGameModels: 'actuels',
  archivedGameModels: 'archivés',
  deletedGameModels: 'supprimés',
  mine: 'les miens',
  all: 'tous',
  gameIsOpen: 'ouvert aux nouveaux joueurs',
  gameIsClosed: 'fermé aux nouveaux joueurs',
  playersCanCreateTeams: 'Les joueurs peuvent créer des équipes',
  playersCantCreateTeams: "Les joueurs ne peuvent pas créer d'équipe",

  //
  kickPlayer: 'supprimer le joueur',
  kickTeam: "supprimer l'équipe",
  teamIsEmpty: "l'équipe est vide",
  kickTrainer: "Supprimer les accès d'animateur",
  addTrainer: 'Ajouter un animateur',
  trainers: 'Animateurs',
  teams: 'Joueurs',

  createGame: 'Ajouter une partie',
  selectGame: 'sélectionner une partie...',
  gameName: 'Nom de la partie',

  settings: 'paramètres',
  basicSettings: 'Paramètres',
  nameIsRequired: 'le nom est requis',
  accessKeyIsRequiered: "clé d'accès requise",
  advancedSettings: 'Paramètres avancés',
  importExport: 'Export',
  langSettings: 'Langues',
  submit: 'sauver',
  comments: 'commentaires',
  commentsAreOptional: 'les commentaires sont facultatifs',

  gameLinkTitle: "Lien d'accès direct",
  gameLinkTitleAsGuest: "Lien d'accès direct en tant qu'invité",
  gameLink: 'Des joueurs connectés peuvent avoir accès à la partie depuis le lien ci-dessous',
  gameLinkGuest:
    'Des invités ou des joueurs connectés peuvent avoir accès à la partie depuis le lien ci-dessous',

  gameType: 'Mode de jeu',
  individual: 'Individuel',
  inTeam: 'En équipe',

  pendingChanges: "Des changements n'ont pas été sauvés...",
  save: 'sauver',
  nothingToDisplay: "il n'y a rien à afficher...",

  //
  GameModel: 'Scénario',
  gameModels: 'Scénarios',
  allGameModels: 'Tous les scenarios',
  uploadGameModel: 'Uploader un scenario',
  createGameModel: 'Créer un scenario',
  gameModelName: 'Nom du scénario',
  openGameModelAsScenarist: 'Éditer le scénario',
  iconSettings: 'icône',
  disclaimer: "Attention! Ne modifier les paramètres avancés qu'en connaissance de cause",

  coScenarist: 'Co-Scénaristes',
  kickScenarist: 'supprimer les accès de scénariste',
  addScenarist: 'ajouter un scénariste',

  logId: 'Log ID',
  guestAllowed: 'Invité autorisés',
  serverScript: 'Server script',
  clientScript: 'Client script',
  css: 'Feuilles de style',
  pages: 'Pages',
  translate: 'Traduire',
  create: 'créer',
  duplicate: 'copier',
  //
  anonymous: 'anonyme',
  versions: 'versions',
  availableVersions: 'versions disponibles',
  restoreVersion: 'restaurer la version',
  deleteVersion: 'supprimer la version',
  createVersion: 'créer une version',
  pdf: 'Télécharger un PDF',
  pdfTooltip: (gm: IGameModel) =>
    `Le PDF d'un ${fr.prettyPrintType(gm)} liste tout son contenu dans format imprimable`,
  exportWgz: 'Exporter au format WGZ',
  exportZip: 'Exporter au format ZIP',
  wgzTooltip: (gm: IGameModel) => `Un export de votre ${fr.prettyPrintType(gm)}`,
  exportJson: 'Exporter en JSON',
  jsonTooltip: (gm: IGameModel) => `Un export de votre ${fr.prettyPrintType(gm)} au format JSON`,
  Model: 'Modèle',
  model: 'modèle',
  ModelRef: 'Reference interne au modèle',
  modelRef: 'reference interne au modèle',
  prettyPrintType: (gameModel: IGameModel) => {
    switch (gameModel.type) {
      case 'MODEL':
        return fr.model;
      case 'REFERENCE':
        return fr.modelRef;
      case 'SCENARIO':
        return fr.scenario;
      case 'PLAY':
        return fr.playScenario;
    }
  },

  // Diff & Patch
  diff: 'Mettre à jour à partir d\'un export WGZ, ZIP ou JSON ',
  patch: 'Accepter la mise à jour',
  restart: 'Refuser la mise à jour',

  //
  ModelInstances: 'Instances du modèle',
  instanceTitle: 'Scénarios basés sur ce modèle',
  noInstances: 'Aucunes instances de ce modèles',
  createModel: 'Créer un modèle',
  inferModel: 'Inférer un modèle',
  modelName: 'nom du modèle',
  integrateScenario: 'Intégrer un scénario',
  releaseScenario: 'Libérer le scénario',

  //ADMIN
  adminConsole: "Bienvenue dans la console d'administration",
  version: 'Version',
  deeplStatus: 'DeepL',
  deeplUsage: 'Utilisation du service de traduction: ',
  doAction: 'Effectuer une action',

  lastSeenAtKey: 'Vu pour la dernière fois',
  lastSeenAt: 'Vu pour la dernière fois :',
  lastActivityDate: "Date d'activité :",

  adminPanel: 'Admin',
  who: 'Qui',
  connectedUsers: 'Utilisateurs connectés',
  users: 'Utilisateurs',
  roles: 'Groupes',
  loggers: 'Loggers',
  locks: 'Verroux',
  gameAdmins: 'Facturation',
  stats: 'Stats',
  createEmptyModel: 'Créer un modèle vide',
  createEmptyReactModel: 'Créer un modèle React vide',
  clearCache: 'Vider le cache JPA',
  deleteAllGameModels:
    'Supprimer tous les scénarios et modèles en attente de suppression définitive',
  requestClientReload:
    'Demander aux utilisateurs de recharger la (p.e après une grosse mise à jour)',

  userIsMemberOf: (user: string) => `"${user}" est membre de ces groupes`,
  userPermissions: (user: string) => `Permissions accordées à "${user}"`,
  createRole: 'Créer un groupe',
  deleteRole: 'Supprimer le groupe',
  showMembers: 'voir les membres',
  members: 'membres',
  roleName: 'nom du groupe',
  numberOfMembers: 'Nombre de membres: ',
  giveRole: 'Ajouter au group',
  removeRole: 'Retirer du groupe',
  addMemberInvite: 'rechercher un utilisateur à ajouter',
  removeAccount: 'Supprimer le compte utilisateur',

  AllScenariosAndModels: 'Tous les scénarios et modèles',
  showPermissions: 'voir les permissions',
  permissions: 'Permissions',
  adminLevelSettins: 'Paramètres visible des administrateurs',
  createPermission: 'Accorder une permission',
  editPermission: 'Éditer la permission',
  deletePermission: 'Retirer la permission',
  none: 'N/A',
  unknown: 'Inconnu',

  showRoles: 'voir les groupes',
  memberAddresses: 'Adresses e-mail des membres du groupe',

  editUser: "éditer l'utilisateur",

  noPlayers: "Vous n'avez pas encore rejoint de partie",
  noGames: 'Aucunes parties disponibles',
  noScenarios: 'Aucuns scénarios disponibles',
  noModels: 'Aucuns modèles disponibles',
  noPermissions: 'Aucune permission',
  noUsers: 'Aucun utilisateur',
  pleaseCreateTeam: 'Veuillez créer un équipe',

  noResults: 'Aucun résultat',
  noPlayersFound: 'Aucune partie trouvée',
  noGamesFound: 'Aucune partie trouvée',
  noScenariosFound: 'Aucun scénario trouvé',
  noModelsFound: 'Aucun modèle trouvé',

  // Invoices
  invoicing: 'Invoicing',
  invoiceTodo: 'A traiter',
  invoiceFree: 'Ne pas facturer',
  invoiceCharged: 'Facturer',
  invoiceDiff: 'delta',

  countMismatch: (declared: number, effective: number) =>
    `${declared} joueurs ont été déclarés mais ${effective} ont été trouvés !`,
  emptyGame: 'aucune équipe',
  emptyTeam: 'équipe vide',
  declared: 'déclarés',
  effective: 'comptés',

  WegasErrorMessage: {
    'IMPOSSIBLE-TO-UPDATE-PASSWORD': 'Vous ne pouvez pas mettre à jour votre mot de passe',
    'COMMONS-SESSIONS-EMPTY-TOKEN-ERROR': "La clé d'accès ne peut pas être vide",
    'COMMONS-SESSIONS-TAKEN-TOKEN-ERROR': "Cette clé d'accès est déjà utilisée",
    'WEGAS-INVITE-SURVEY-NO-EMAIL':
      "Aucun joueur n'a encore rejoint le jeu<br>(ou alors ils n'ont pas enregistré d'adresse e-mail)",
    'CREATE-ACCOUNT-INVALID-EMAIL': 'Adresse e-mail invalide',
    'CREATE-ACCOUNT-TAKEN-EMAIL': 'Adresse e-mail déjà utilisée',
    'CREATE-ACCOUNT-TAKEN-USERNAME': "Nom d'utilisateur déjà utilisé",
  },
  outadateMessagePart1: 'Vos données ne sont plus à jour. Merci de ',
  outadateMessagePart2: 'recharger',
  outadateMessagePart3: ' la page',
  pleaseWait: 'Veuillet patienter...',
  autoplay: {
    loginAsGuest: "Préparation d'un compte invité en cours...",
  },
  tokenNotFound: 'Jeton introuvable',
  defaultProcessMessage: 'Poursuivre',
  processMessages: {
    InviteToJoinToken: "Rejoindre la partie",
    ValidateAddressToken: "Valider votre adresse",
    ResetPasswordToken: "Mettre à jour votre mot de passe",
    SurveyToken: "Participer au sondage",
  },
  youAreConnectedAsUser: (user: string) => `Vous êtes actuellement connecter en tant que "${user}"`,
  butCraftedFor: (user: string) => `alors que votre lien a été préparer pour "${user}"`,
  logoutForPrivacy: 'Pour garantir votre anonymat, vous devez vous déconnecter',
  logoutToContinue: 'Pour pouvoir continuer, vous devez vous déconnecter',
  invalidToken: 'Jeton invalide',
  processing: 'en cours...',
  andXMore: (x: number) => `et ${x} autres...`,
  status: {
    LIVE: 'actuel',
    BIN: 'archivé',
    DELETE: 'supprimé',
    SUPPRESSED: 'définitivement supprimé',
  },
  userLevels: {
    0: 'Administrateurs',
    1: 'Scenaristes/Animateurs',
    2: 'Joueurs',
    3: 'Invités',
    4: 'Role inconnu ???',
  },
  aaiAccount: 'Compte AAI',
  aaiAffiliation: 'Etablissement',
  aaiNotEditable: 'Les données personnelles ne sont pas éditables',
  refresh: 'rafraichir',
};
