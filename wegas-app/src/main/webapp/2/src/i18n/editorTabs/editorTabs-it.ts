import { EditorTabsTranslations } from './definitions';

export const editorTabsTranslationsIT: EditorTabsTranslations = {
  tabsNames: {
    Tester: 'Tester',
    Variables: 'Variabili',
    'State Machine': 'Macchina a stati',
    'Variable Properties': 'Proprietà variabili',
    Files: 'File',
    Scripts: 'Scripts',
    Styles: 'Stili',
    Client: 'Cliente',
    Server: 'Server',
    'Language Editor': 'Editore di lingue',
    'Client Console':  'Console client',
    'Server Console': 'Console server',
    'Instances Editor': 'Editor di istanze',
    'Theme Editor': 'Editor di temi',
    Theme: 'Tema',
    Preview: 'Anteprima',
    Modes: 'Modi',
    'Page Editor': 'Editore di pagina',
    'Component Palette': 'Palette di componenti',
    'Page Display': 'Visualizzazione pagina',
    'Pages Layout': 'Layout di pagine',
    'Source Editor': 'Editore di fonte',
    'Component Properties': 'Proprietà del componente',
  },
  stateMachine: {
    selectVariable: 'Selezionare una variabile da visualizzare',
    selectedNotStateMachine: 'La variabile selezionata non è una specie di macchina di stato',
  },
  fileBrowser: {
    fileInsertFailed: 'Inserimento di file non riuscito',
    overrideFile: (fileName) => `Sei sicuro di voler sovrascrivere il file [${fileName}]?`,
    deleteFolder: 'Sei sicuro di cancellare la cartella e tutte le sue sottodirectory?',
    uploadNew: 'Carica la nuova versione',
    uploadFile: 'Carica il file',
    uploadFileFolder: 'Carica il file nella cartella',
    addNewFolder: 'Aggiungi una nuova cartella',
    newFolder: 'Neuer Ordner',
    openFile: 'Aprire il file',
    changeType: (fromFileType, toFileType) => `Sei sicuro di voler cambiare il tipo di file da ${fromFileType} a ${toFileType}?`,
    directoryName: 'Nome dell\'elenco',
    uploading: (nbUploadingFiles) => `Caricamento di ${nbUploadingFiles} file`,
    directory: (directoryName) => `La directory ${directoryName} esiste già`,
  },
  scripts: {
    scriptNameNotAvailable: 'Nome dello script non disponibile (lo script esiste già o il nome contiene caratteri sbagliati)',
    cannotCreateScript:  'Impossibile creare lo script',
    cannotDeleteScript:  'Impossibile cancellare lo script',
    cannotGetScripts: 'Impossibile ottenere gli script',
    librarySavedErrors: 'La biblioteca è stata salvata ma lo script contiene errori',
    libraryCannotSave: 'La biblioteca non può essere salvata',
    libraryCannotDelete:  'La biblioteca non può essere cancellata',
    libraryName: 'Nome della biblioteca',
    libraryMustName: 'La biblioteca deve avere un nome',
    addNewScript: 'Aggiungere un nuovo script',
    noLibrarySelected: 'Nessuna biblioteca selezionata',
    saveScript: 'Salvare lo script',
    deleteScript: 'Cancellare lo script',
    scriptDangerOutdate: 'Lo script è pericolosamente superato!',
    scriptNotSaved: 'Lo script non viene salvato',
    scriptSaved: 'Lo script viene salvato',
    createLibraryPlease: 'Crea una biblioteca premendo il pulsante +',
  },
  instanceProps: {
    noDescriptorEdited: 'Nessun descrittore è stato modificato',
    currentGameModel: 'Modello di gioco attuale',
  },
  themeEditor: {
    contexts: 'Contesti',
    themeNameVal: (name) => `Tema di ${name} :`,
    themeAlreadyExists: 'Il tema esiste già',
    theme: (t) => `Tema: ${t}`,
    themeName: 'Nome del tema',
    addTheme: 'Aggiungi un tema',
    modeAlreadyExists: 'Il modo esiste già',
    mode: (m) => `Modo: ${m}`,
    modeName: 'Nome del modo',
    addMode: 'Aggiungere il modo',
    showSection: 'Mostra la sezione',
    primaryColors: 'Colori primari',
    secondaryColors: 'Colori secondari',
    backgroundColors: 'Colori di sfondo',
    textColors: 'Colori del testo',
    otherColors: 'Altri colori',
    previewPage: 'Pagina di anteprima',
    componentState: 'Stato dei componenti',
    someText: 'Alcuni testi',
    clickMe: 'Cliccare qui',
    nextMode: 'Modo successivo : ',
    states: (state) => {
      if(state === 'disabled')return 'Disattivato';
      else if(state === 'readOnly')return 'Leggere solo';
      else return state;
    },
    sections: (section) => {
      switch (section) {
        case 'colors':
          return 'Colori';
        case 'dimensions':
          return 'Dimensioni';
        case 'others':
          return 'Altri';
        default:
          return section;
      }
    },
    themeColorShades: {
      main: 'Principale',
      tint: 'Tinta',
      shade: 'Ombra',
      pastel: 'Pastello',
      secondary: 'Secondario',
      dark: 'Oscuro',
      'dark secondary': 'Secondario oscuro',
      'Accent color': 'Colore d\'accento',
      'Disabled color': 'Colore disattivato',
      'Error color': 'Colore di errore',
      'Warning color': 'Colore d\'avvertimento',
      'Success color': 'Colore di successo',
    }
  }
};
