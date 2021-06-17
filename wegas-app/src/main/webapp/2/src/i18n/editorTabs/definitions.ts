export interface EditorTabsTranslations {
  tabsNames: {
    Tester: string;
    Variables: string;
    'State Machine': string;
    'Variable Properties': string;
    Files: string;
    Scripts: string;
    Styles: string;
    Client: string;
    Server: string;
    'Language Editor': string;
    'Client Console': string;
    'Server Console': string;
    'Instances Editor': string;
    'Theme Editor': string;
    Theme: string;
    Preview: string;
    Modes: string;
    'Page Editor': string;
    'Component Palette': string;
    'Page Display': string;
    'Pages Layout': string;
    'Source Editor': string;
    'Component Properties': string;
  },
  stateMachine: {
    selectVariable: string;
    selectedNotStateMachine: string;
  }
  fileBrowser: {
    fileInsertFailed: string;
    overrideFile: (fileName: string) => string;
    deleteFolder: string;
    uploadNew: string;
    uploadFile: string;
    uploadFileFolder: string;
    addNewFolder: string;
    newFolder: string;
    newPage: string;
    pageName: string;
    folderName: string;
    itemMustName: (item?:string) => string;
    page: string;
    folder: string;
    openFile: string;
    changeType: (fromFileType: string, toFileType: string) => string;
    directoryName: string;
    uploading: (nbUploadingFiles: string) => string;
    directory: (directoryPath: string) => string;
  },
  scripts: {
    scriptNameNotAvailable: string;
    cannotCreateScript: string;
    cannotDeleteScript: string;
    cannotGetScripts: string;
    librarySavedErrors: string;
    libraryCannotSave: string;
    libraryCannotDelete: string;
    libraryMustName: string;
    libraryName: string;
    addNewScript: string;
    noLibrarySelected: string;
    saveScript: string;
    deleteScript: string;
    scriptDangerOutdate: string;
    scriptNotSaved: string;
    scriptSaved: string;
    createLibraryPlease: string;
  },
  instanceProps: {
    noDescriptorEdited: string;
    currentGameModel: string;
  },
  themeEditor: {
    contexts: string;
    themeNameVal: (name: string) => string;
    themeAlreadyExists: string;
    theme: (t: string) => string;
    themeName: string;
    addTheme: string;
    modeAlreadyExists: string;
    mode: (m: string) => string;
    modeName: string;
    addMode: string;
    showSection: string;
    primaryColors: string;
    secondaryColors: string;
    backgroundColors: string;
    textColors: string;
    otherColors: string;
    previewPage: string;
    componentState: string;
    someText: string;
    clickMe: string;
    nextMode: string;
    states: (state: string) => string;
    sections: (section: string) => string;
    themeColorShades: {
      main: string;
      tint: string;
      shade: string;
      pastel: string;
      secondary: string;
      dark: string;
      'dark secondary': string;
      'Accent color': string;
      'Disabled color': string;
      'Error color': string;
      'Warning color': string;
      'Success color': string;
    }
  },
  pageEditor: {
    showControls: string;
    editMode: string;
    toggleBorders: string;
    unknownComponent: string;
    addComponent: string;
    firstCompoNotDeleted: string;
    deleteComponent: string;
    copyComponent: string;
    adddNewPageFolder: string;
    defaultPage: string;
    scenaristPage: string;
    trainerPage: string;
    folderMustEmpty: string;
    deletePageOrFolder: (item: string) => string;
    editorMustEnabled: string;
    enableEditMode: string;
    back: string;
    componentTypes: {
      Other: string;
      Layout: string;
      Input: string;
      Output: string;
      Advanced: string;
      Programmatic: string;
    }
  }
}
