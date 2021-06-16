import { EditorTabsTranslations } from './definitions';

export const editorTabsTranslationsDE: EditorTabsTranslations = {
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
    'Language Editor': 'Sprach-Editor',
    'Client Console':  'Client-Konsole',
    'Server Console': 'Server-Konsole',
    'Instances Editor': 'Instanzen-Editor',
    'Theme Editor': 'Theme-Editor',
    Theme: 'Thema',
    Preview: 'Vorschau',
    Modes: 'Modi',
    'Page Editor': 'Seite Editor',
    'Component Palette': 'Komponenten-Palette',
    'Page Display': 'Anzeige der Seite',
    'Pages Layout': 'Seitenlayout',
    'Source Editor': 'Quell-Editor',
    'Component Properties': 'Eigenschaften Komponente',
  },
  stateMachine: {
    selectVariable: 'Wählen Sie eine Variable zur Anzeige aus',
    selectedNotStateMachine: 'Die ausgewählte Variable ist keine Art von Zustandsmaschine',
  },
  fileBrowser: {
    fileInsertFailed: 'Datei einfügen fehlgeschlagen',
    overrideFile: (fileName) => `Sind Sie sicher, dass Sie die Datei [${fileName}] überschreiben wollen ?`,
    deleteFolder: 'Sind Sie sicher, dass Sie den Ordner und alle seine Unterverzeichnisse löschen müssen?',
    uploadNew: 'Neue Version hochladen',
    uploadFile: 'Datei hochladen',
    uploadFileFolder: 'Datei in den Ordner hochladen',
    addNewFolder: 'Neuen Ordner hinzufügen',
    newFolder: 'Neuer Ordner',
    openFile: 'Datei öffnen',
    changeType: (fromFileType, toFileType) => `Sind Sie sicher, dass Sie den Dateityp von ${fromFileType} in ${toFileType} ändern möchten?`,
    directoryName: 'Verzeichnisname',
    uploading: (nbUploadingFiles) => `Hochladen von ${nbUploadingFiles} Dateien`,
    directory: (directoryName) => `Verzeichnis ${directoryName} existiert bereits`,
  },
  scripts: {
    scriptNameNotAvailable: 'Skriptname nicht verfügbar (Skript existiert bereits oder der Name enthält falsche Zeichen)',
    cannotCreateScript:  'Kann das Skript nicht erstellen',
    cannotDeleteScript:  'Kann das Skript nicht löschen',
    cannotGetScripts: 'Kann die Skripte nicht erhalten',
    librarySavedErrors: 'Die Bibliothek wurde gespeichert, aber das Skript enthält Fehler',
    libraryCannotSave: 'Die Bibliothek kann nicht gespeichert werden',
    libraryCannotDelete:  'Die Bibliothek kann nicht gelöscht werden',
    libraryName: 'Name der Bibliothek',
    libraryMustName: 'Die Bibliothek muss einen Namen haben',
    addNewScript: 'Ein neues Skript hinzufügen',
    noLibrarySelected: 'Keine Bibliothek ausgewählt',
    saveScript: 'Speichern Sie das Skript',
    deleteScript: 'Löschen Sie das Skript',
    scriptDangerOutdate: 'Das Skript ist gefährlich veraltet!',
    scriptNotSaved: 'Das Skript wird nicht gespeichert',
    scriptSaved: 'Das Skript wird gespeichert',
    createLibraryPlease: 'Bitte legen Sie eine Bibliothek an, indem Sie die Taste + drücken',
  },
  instanceProps: {
    noDescriptorEdited: 'Es wird kein Deskriptor bearbeitet',
    currentGameModel: 'Aktuelles Spielmodell',
  },
  themeEditor: {
    contexts: 'Kontexte',
    themeNameVal: (name) => `Thema von ${name} :`,
    themeAlreadyExists: 'Das Thema existiert bereits',
    theme: (t) => `Thema: ${t}`,
    themeName: 'Name des Themas',
    addTheme: 'Thema hinzufügen',
    modeAlreadyExists: 'Der Modus ist bereits vorhanden',
    mode: (m) => `Modus: ${m}`,
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
    states: (state) => {
      if(state === 'disabled')return 'Deaktiviert';
      else if(state === 'readOnly')return 'Nur lesen';
      else return state;
    },
    sections: (section) => {
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
    }
    }
};
