import { EditorTabsTranslations } from './definitions';

export const editorTabsTranslationsIT: EditorTabsTranslations = {
  miscellaneous: {
    noAvailableTabs:
      'Nessuna scheda disponibile. Provare a cambiare il proprio ruolo nel menu di amministrazione in alto a sinistra',
  },
  tabsNames: {
    Tester: 'Tester',
    Variables: 'Variabili',
    'State Machine': 'Macchina a stati',
    'Variable Properties': 'Proprietà delle variabili',
    Files: 'File',
    Scripts: 'Scripts',
    Styles: 'Stili',
    Client: 'Cliente',
    Server: 'Server',
    AllLibs: 'All Libraries',
    Languages: 'Lingue',
    'Client Console': 'Console client',
    'Server Console': 'Console server',
    'Instances Editor': 'Editor di istanze',
    'Theme Editor': 'Editor di temi',
    Theme: 'Tema',
    Preview: 'Anteprima',
    Modes: 'Modi',
    Pages: 'Pagine',
    'Component Palette': 'Palette di componenti',
    'Page Display': 'Visualizzazione pagina',
    'Pages Layout': 'Layout di pagine',
    'Source Editor': 'Editore di fonte',
    'Component Properties': 'Proprietà del componente',
    'Language editor': 'Editore di lingue',
    'Translation manager': 'Gestione delle traduzioni',
  },
  stateMachine: {
    selectVariable:
      'Selezionare una macchina di stato o un dialogo da visualizzare',
    selectedNotStateMachine:
      'La variabile selezionata non è una specie di macchina di stato',
  },
  fileBrowser: {
    fileInsertFailed: 'Inserimento di file non riuscito',
    overrideFile: fileName =>
      `Sei sicuro di voler sovrascrivere il file [${fileName}]?`,
    deleteFolder:
      'Sei sicuro di cancellare la cartella e tutte le sue sottodirectory?',
    uploadNew: 'Carica la nuova versione',
    uploadFile: 'Carica il file',
    uploadFileFolder: 'Carica il file nella cartella',
    addNewFolder: 'Aggiungi una nuova cartella',
    newFolder: 'Nuova cartella',
    newPage: 'Nuova pagina',
    pageName: 'Nome della pagina',
    folderName: 'Nome della cartella',
    itemMustName: item => `${item ? item : "L'elemento"} deve avere un nome.`,
    page: 'La pagina',
    folder: 'La cartella',
    openFile: 'Aprire il file',
    changeType: (fromFileType, toFileType) =>
      `Sei sicuro di voler cambiare il tipo di file da ${fromFileType} a ${toFileType}?`,
    directoryName: "Nome dell'elenco",
    uploading: nbUploadingFiles => `Caricamento di ${nbUploadingFiles} file`,
    directory: directoryName => `La directory ${directoryName} esiste già`,
  },
  scripts: {
    scriptNameNotAvailable:
      'Nome dello script non disponibile (lo script esiste già o il nome contiene caratteri sbagliati)',
    cannotCreateScript: 'Impossibile creare lo script',
    cannotDeleteScript: 'Impossibile cancellare lo script',
    cannotGetScripts: 'Impossibile ottenere gli script',
    librarySavedErrors:
      'La biblioteca è stata salvata ma lo script contiene errori',
    libraryIsOutdated:
      'La biblioteca è obsoleta e non può essere salvata. Riprovare o unire.',
    libraryCannotDelete: 'La biblioteca non può essere cancellata',
    libraryName: 'Nome della biblioteca',
    libraryMustName: 'La biblioteca deve avere un nome',
    addNewScript: 'Aggiungere un nuovo script',
    noLibrarySelected: 'Nessuna biblioteca selezionata',
    downloadScript: 'Scaricare lo script',
    saveScript: 'Salvare lo script',
    deleteScript: 'Cancellare lo script',
    scriptDangerOutdate: 'Lo script è pericolosamente superato!',
    scriptNotSaved: 'Lo script non viene salvato',
    scriptSaved: 'Lo script viene salvato',
    createLibraryPlease: 'Crea una biblioteca premendo il pulsante +',
    canntoBeParsed: 'Lo script non può essere analizzato',
    canntoBeParsedCondition:
      'Lo script non può essere analizzato come condizione',
  },
  instanceProps: {
    noDescriptorEdited: 'Nessun descrittore è stato modificato',
    currentGameModel: 'Modello di gioco attuale',
  },
  themeEditor: {
    contexts: 'Contesti',
    themeNameVal: name => `Tema di ${name} :`,
    themeAlreadyExists: 'Il tema esiste già',
    theme: t => `Tema: ${t}`,
    themeName: 'Nome del tema',
    addTheme: 'Aggiungi un tema',
    deleteTheme: 'Cancellare il tema',
    modeAlreadyExists: 'Il modo esiste già',
    mode: m => `Modo: ${m}`,
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
    deleteMode: 'Cancellare il modo',
    setMainMode: 'Imposta come modalità principale',
    states: state => {
      if (state === 'disabled') return 'Disattivato';
      else if (state === 'readOnly') return 'Leggere solo';
      else return state;
    },
    sections: section => {
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
      'Accent color': "Colore d'accento",
      'Disabled color': 'Colore disattivato',
      'Error color': 'Colore di errore',
      'Warning color': "Colore d'avvertimento",
      'Success color': 'Colore di successo',
    },
  },
  pageEditor: {
    showControls: 'Mostra i controlli: ',
    editMode: 'Modo di modifica: ',
    toggleBorders: 'Alzare i bordi: ',
    unknownComponent: 'Componente sconosciuto',
    addComponent: 'Aggiungere un componente',
    firstCompoNotDeleted:
      'Il primo componente di una pagina non può essere cancellato',
    deleteComponent: 'Cancella il componente',
    copyComponent: 'Copiare il componente',
    adddNewPageFolder: 'Aggiungere una nuova pagina o cartella',
    defaultPage: 'Pagina predefinita',
    scenaristPage: 'Pagina di Scenarista',
    trainerPage: 'Pagina del formatore',
    folderMustEmpty: 'La cartella deve essere vuota per eliminarla',
    deletePageOrFolder: item => `Cancellare ${item}`,
    editorMustEnabled:
      'La modalità di modifica deve essere abilitata per utilizzare la tavolozza.',
    enableEditMode: 'Abilita la modalità di modifica',
    back: 'Indietro',
    componentTypes: {
      Other: 'Altro',
      Layout: 'Layout',
      Input: 'Ingresso',
      Output: 'Uscita',
      Advanced: 'Avanzato',
      Maps: 'Maps',
      Programmatic: 'Programmatico',
      Utility: 'Utilità',
    },
  },
  languageEditor: {
    languages: 'Lingue',
  },
  variableProperties: {
    toggleCoding: 'Alterna la console di codifica',
    runScripts: 'Eseguire gli script',
    deleteGroup: 'Cancellare questo gruppo',
  },
};
