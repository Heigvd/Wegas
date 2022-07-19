import { EditorTabsTranslations } from './definitions';

export const editorTabsTranslationsDE: EditorTabsTranslations = {
  miscellaneous: {
    noAvailableTabs:
      'Keine Registerkarte verfügbar. Versuchen Sie Ihre Rolle im Admin-Menü oben links zu ändern',
  },
  tabsNames: {
    Tester: 'Tester',
    Variables: 'Variablen',
    'State Machine': 'Zustandsmaschine',
    'Variable Properties': 'Eigenschaften Variablen',
    Files: 'Dateien',
    Scripts: 'Skripte',
    Styles: 'Stile',
    Client: 'Client',
    Server: 'Server',
    AllLibs: 'Alles Libraries',
    Languages: 'Sprachen',
    'Client Console': 'Client-Konsole',
    'Server Console': 'Server-Konsole',
    'Instances Editor': 'Instanzen-Editor',
    'Theme Editor': 'Theme-Editor',
    Theme: 'Thema',
    Preview: 'Vorschau',
    Modes: 'Modi',
    Pages: 'Seiten',
    'Component Palette': 'Komponenten-Palette',
    'Page Display': 'Anzeige der Seite',
    'Pages Layout': 'Seitenlayout',
    'Source Editor': 'Quell-Editor',
    'Component Properties': 'Eigenschaften Komponente',
    'Language editor': 'Spracheditor',
    'Translation manager': 'Übersetzungsmanager',
  },
  stateMachine: {
    selectVariable:
      'Wählen Sie eine Statusmaschine oder einen Dialog zur Anzeige',
    selectedNotStateMachine:
      'Die ausgewählte Variable ist keine Art von Zustandsmaschine',
  },
  fileBrowser: {
    fileInsertFailed: 'Datei einfügen fehlgeschlagen',
    overrideFile: fileName =>
      `Sind Sie sicher, dass Sie die Datei [${fileName}] überschreiben wollen ?`,
    deleteFolder:
      'Sind Sie sicher, dass Sie den Ordner und alle seine Unterverzeichnisse löschen müssen?',
    uploadNew: 'Neue Version hochladen',
    uploadFile: 'Datei hochladen',
    uploadFileFolder: 'Datei in den Ordner hochladen',
    addNewFolder: 'Neuen Ordner hinzufügen',
    newFolder: 'Neuer Ordner',
    newPage: 'Neue Seite',
    pageName: 'Seitenname',
    folderName: 'Ordnername',
    itemMustName: item =>
      `${item ? item : 'Das Element'} muss einen Namen haben.`,
    page: 'Die Seite',
    folder: 'Der Ordner',
    openFile: 'Datei öffnen',
    changeType: (fromFileType, toFileType) =>
      `Sind Sie sicher, dass Sie den Dateityp von ${fromFileType} in ${toFileType} ändern möchten?`,
    directoryName: 'Verzeichnisname',
    uploading: nbUploadingFiles => `Hochladen von ${nbUploadingFiles} Dateien`,
    directory: directoryName =>
      `Verzeichnis ${directoryName} existiert bereits`,
  },
  scripts: {
    scriptNameNotAvailable:
      'Skriptname nicht verfügbar (Skript existiert bereits oder der Name enthält falsche Zeichen)',
    cannotCreateScript: 'Kann das Skript nicht erstellen',
    cannotDeleteScript: 'Kann das Skript nicht löschen',
    cannotGetScripts: 'Kann die Skripte nicht erhalten',
    librarySavedErrors:
      'Die Bibliothek wurde gespeichert, aber das Skript enthält Fehler',
    libraryIsOutdated:
      'Die Bibliothek ist veraltet und kann nicht gespeichert werden. Versuchen Sie es erneut oder fügen Sie es zusammen.',
    libraryCannotDelete: 'Die Bibliothek kann nicht gelöscht werden',
    libraryName: 'Name der Bibliothek',
    libraryMustName: 'Die Bibliothek muss einen Namen haben',
    addNewScript: 'Ein neues Skript hinzufügen',
    noLibrarySelected: 'Keine Bibliothek ausgewählt',
    saveScript: 'Speichern Sie das Skript',
    deleteScript: 'Löschen Sie das Skript',
    downloadScript: 'Herunterladen Sie das Skript',
    scriptDangerOutdate: 'Das Skript ist gefährlich veraltet!',
    scriptNotSaved: 'Das Skript wird nicht gespeichert',
    scriptSaved: 'Das Skript wird gespeichert',
    createLibraryPlease:
      'Bitte legen Sie eine Bibliothek an, indem Sie die Taste + drücken',
    canntoBeParsed: 'Das Skript kann nicht geparst werden',
    canntoBeParsedCondition:
      'Das Skript kann nicht als Bedingung geparst werden',
  },
  instanceProps: {
    noDescriptorEdited: 'Es wird kein Deskriptor bearbeitet',
    currentGameModel: 'Aktuelles Spielmodell',
  },
  themeEditor: {
    contexts: 'Kontexte',
    themeNameVal: name => `Thema von ${name} :`,
    themeAlreadyExists: 'Das Thema existiert bereits',
    theme: t => `Thema: ${t}`,
    themeName: 'Name des Themas',
    addTheme: 'Thema hinzufügen',
    deleteTheme: 'Thema löschen',
    modeAlreadyExists: 'Der Modus ist bereits vorhanden',
    mode: m => `Modus: ${m}`,
    modeName: 'Name des Modus',
    addMode: 'Modus hinzufügen',
    showSection: 'Abschnitt anzeigen',
    primaryColors: 'Primärfarben',
    secondaryColors: 'Sekundärfarben',
    backgroundColors: 'Hintergrundfarben',
    textColors: 'Textfarben',
    otherColors: 'Andere Farben',
    previewPage: 'Vorschau Seite',
    componentState: 'Zustand der Komponenten',
    someText: 'Etwas Text',
    clickMe: 'Klicken Sie hier',
    nextMode: 'Nächster Modus : ',
    deleteMode: 'Modus löschen',
    setMainMode: 'Als Hauptmodus einstellen',
    states: state => {
      if (state === 'disabled') return 'Deaktiviert';
      else if (state === 'readOnly') return 'Nur lesen';
      else return state;
    },
    sections: section => {
      switch (section) {
        case 'colors':
          return 'Farben';
        case 'dimensions':
          return 'Abmessungen';
        case 'others':
          return 'Andere';
        default:
          return section;
      }
    },
    themeColorShades: {
      main: 'Haupt',
      tint: 'Tönung',
      shade: 'Schatten',
      pastel: 'Pastell',
      secondary: 'Sekundär',
      dark: 'Dunkel',
      'dark secondary': 'Dunkel sekundär',
      'Accent color': 'Akzentfarbe',
      'Disabled color': 'Deaktivierte Farbe',
      'Error color': 'Fehlerfarbe',
      'Warning color': 'Warnfarbe',
      'Success color': 'Erfolgsfarbe',
    },
  },
  pageEditor: {
    showControls: 'Bedienelemente anzeigen: ',
    editMode: 'Bearbeitungsmodus: ',
    toggleBorders: 'Grenzen umschalten: ',
    unknownComponent: 'Unbekannte Komponente',
    addComponent: 'Eine Komponente hinzufügen',
    firstCompoNotDeleted:
      'Die erste Komponente einer Seite darf nicht gelöscht werden',
    deleteComponent: 'Die Komponente löschen',
    copyComponent: 'Die Komponente kopieren',
    adddNewPageFolder: 'Neue Seite oder Ordner hinzufügen',
    defaultPage: 'Default-Seite',
    scenaristPage: 'Scenarist Seite',
    trainerPage: 'Trainer Seite',
    folderMustEmpty: 'Der Ordner muss leer sein, um ihn zu löschen',
    deletePageOrFolder: item => `Löschen Sie ${item}`,
    editorMustEnabled:
      'Der Bearbeitungsmodus muss aktiviert sein, um die Palette verwenden zu können.',
    enableEditMode: 'Bearbeitungsmodus einschalten',
    back: 'Zurück',
    componentTypes: {
      Other: 'Andere',
      Layout: 'Layout',
      Input: 'Eingang',
      Output: 'Ausgang',
      Advanced: 'Erweitert',
      Maps: 'Maps',
      Programmatic: 'Programmatisch',
      Utility: 'Hilfsmittel',
    },
  },
  languageEditor: {
    languages: 'Sprachen',
  },
  variableProperties: {
    toggleCoding: 'Kodierkonsole umschalten',
    runScripts: 'Skripte ausführen',
    deleteGroup: 'Diese Gruppe löschen',
  },
};
