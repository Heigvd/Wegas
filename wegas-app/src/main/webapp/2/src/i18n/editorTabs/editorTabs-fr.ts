import { EditorTabsTranslations } from './definitions';

export const editorTabsTranslationsFR: EditorTabsTranslations = {
  tabsNames: {
    Tester: 'Testeur',
    Variables: 'Variables',
    'State Machine': "Machine d'états",
    'Variable Properties': 'Propriétés variables',
    Files: 'Fichiers',
    Scripts: 'Scripts',
    Styles: 'Styles',
    Client: 'Client',
    Server: 'Serveur',
    'Language Editor': 'Éditeur langues',
    'Client Console': 'Console client',
    'Server Console': 'Console serveur',
    'Instances Editor': "Éditeur d'instances",
    'Theme Editor': 'Éditeur de thème',
    Theme: 'Thème',
    Preview: 'Aperçu',
    Modes: 'Modes',
    'Page Editor': 'Éditeur de page',
    'Component Palette': 'Palette de composants',
    'Page Display': 'Affichage page',
    'Pages Layout': 'Composition pages',
    'Source Editor': 'Éditeur de source',
    'Component Properties': 'Propriétés du composant',
  },
  stateMachine: {
    selectVariable: 'Choisissez une variable à afficher',
    selectedNotStateMachine:
      "La variable sélectionnée n'est pas de type State Machine",
  },
  fileBrowser: {
    fileInsertFailed: "L'insertion du document a échoué",
    overrideFile: fileName =>
      `Êtes-vous sûr-e de vouloir remplacer le fichier [${fileName}]?`,
    deleteFolder:
      'Êtes-vous sûr-e de supprimer le dossier et tous ses sous-répertoires ?',
    uploadNew: 'Charger une nouvelle version',
    uploadFile: 'Charger document',
    uploadFileFolder: 'Charger le document dans le dossier',
    addNewFolder: 'Ajouter nouveau dossier',
    newFolder: 'Nouveau dossier',
    newPage: 'Nouvelle page',
    pageName: 'Nom de la page',
    folderName: 'Nom du dossier',
    itemMustName: item => `${item ? item : "L'élément"} doit avoir un nom.`,
    page: 'la page',
    folder: 'le dossier',
    openFile: 'Ouvrir le fichier',
    changeType: (fromFileType, toFileType) =>
      `Êtes-vous sûr-e de vouloir modifier le type du fichier, de ${fromFileType} en ${toFileType}?`,
    directoryName: 'Nom du répertoire',
    uploading: nbUploadingFiles => `Charger ${nbUploadingFiles} fichiers`,
    directory: directoryName => `Le répertoire ${directoryName} existe déjà`,
  },
  scripts: {
    scriptNameNotAvailable:
      'Nom de script non disponible (le script existe déjà ou le nom contient des mauvais caractères)',
    cannotCreateScript: 'Impossible de créer le script',
    cannotDeleteScript: 'Impossible de supprimer le script',
    cannotGetScripts: 'Impossible de récupérer les scripts',
    librarySavedErrors:
      'La bibliothèque a été sauvegardée mais le script contient des erreurs',
    libraryCannotSave: 'La bibliothèque ne peut pas être enregistrée',
    libraryCannotDelete: 'La bibliothèque ne peut pas être supprimée',
    libraryName: 'Nom de la bibliothèque',
    libraryMustName: 'La bibliothèque doit avoir un nom',
    addNewScript: 'Ajouter un nouveau script',
    noLibrarySelected: 'Aucune bibliothèque sélectionnée',
    saveScript: 'Sauvegarder le script',
    deleteScript: 'Supprimer le script',
    scriptDangerOutdate: 'Le script est dangereusement obsolète !',
    scriptNotSaved: "Le script n'est pas sauvegardé",
    scriptSaved: 'Le script est sauvegardé',
    createLibraryPlease:
      'Veuillez créer une bibliothèque en appuyant sur le bouton +.',
      canntoBeParsed: 'Le script ne peut pas être analysé',
    canntoBeParsedCondition: 'Le script ne peut pas être analysé comme une condition',
  },
  instanceProps: {
    noDescriptorEdited: "Aucun descripteur n'est en cours d'édition",
    currentGameModel: 'Modèle de jeu actuel',
  },
  themeEditor: {
    contexts: 'Contextes',
    themeNameVal: name => `${name} thème :`,
    themeAlreadyExists: 'Le thème existe déjà',
    theme: t => `Thème: ${t}`,
    themeName: 'Nom du thème',
    addTheme: 'Ajouter un thème',
    deleteTheme: 'Supprimer le thème',
    modeAlreadyExists: 'Le mode existe déjà',
    mode: m => `Mode: ${m}`,
    modeName: 'Nom du mode',
    addMode: 'Ajouter un mode',
    showSection: 'Afficher section',
    primaryColors: 'Couleurs primaires',
    secondaryColors: 'Couleurs secondaires',
    backgroundColors: 'Couleurs de fond',
    textColors: 'Couleurs de texte',
    otherColors: 'Autres couleurs',
    previewPage: "Page d'aperçu",
    componentState: 'État des composants',
    someText: 'Du texte',
    clickMe: 'Clique ici',
    nextMode: 'Mode suivant : ',
    deleteMode: 'Supprimer le mode',
    setMainMode: 'Choisir comme mode principal',
    states: state => {
      if (state === 'disabled') return 'Désactivé';
      else if (state === 'readOnly') return 'Lecture seule';
      else return state;
    },
    sections: section => {
      switch (section) {
        case 'colors':
          return 'Couleurs';
        case 'dimensions':
          return 'Dimensions';
        case 'others':
          return 'Autres';
        default:
          return section;
      }
    },
    themeColorShades: {
      main: 'Principale',
      tint: 'Tinte',
      shade: 'Ombre',
      pastel: 'Pastel',
      secondary: 'Secondaire',
      dark: 'Sombre',
      'dark secondary': 'Secondaire sombre',
      'Accent color': "Couleur d'accentuation",
      'Disabled color': 'Couleurs désactivé',
      'Error color': "Couleur d'erreur",
      'Warning color': "Couleur d'attention",
      'Success color': 'Couleur de succès',
    },
  },
  pageEditor: {
    showControls: 'Afficher les contrôles: ',
    editMode: 'Mode édition: ',
    toggleBorders: 'Afficher les bords: ',
    unknownComponent: 'Composant inconnu',
    addComponent: 'Ajouter un composant',
    firstCompoNotDeleted:
      "Le premier cpomposant d'une page ne peut être supprimé",
    deleteComponent: 'Supprimer le composant',
    copyComponent: 'Copier le composant',
    adddNewPageFolder: 'Ajouter une nouvelle page ou un nouveau dossier',
    defaultPage: 'Page par défaut',
    scenaristPage: 'Page scénariste',
    trainerPage: 'Page formateur',
    folderMustEmpty: 'Le dossier doit être vide pour le supprimer.',
    deletePageOrFolder: item => `Supprimer ${item}`,
    editorMustEnabled:
      'Le mode édition doit être activé pour pouvoir utiliser la palette.',
    enableEditMode: 'Activer le mode édition',
    back: 'Retour',
    componentTypes: {
      Other: 'Autre',
      Layout: 'Mise en page',
      Input: 'Entrée',
      Output: 'Sortie',
      Advanced: 'Avancé',
      Programmatic: 'Programmatique',
    },
  },
  languageEditor: {
    languages: 'Langues',
  },
  variableProperties: {
    toggleCoding: 'Afficher/Masquer la console de codage',
    runScripts: 'Exécuter les scripts',
    deleteGroup: 'Supprimer ce groupe',
  },
};
