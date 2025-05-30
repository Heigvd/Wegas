import { ComponentType } from '../../Components/PageComponents/tools/componentFactory';

/** use separate const to have formal typings */
const compTypes: Record<ComponentType, string> = {
  Other: 'Other',
  Layout: 'Layout',
  Input: 'Input',
  Output: 'Output',
  Advanced: 'Advanced',
  Maps: 'Maps',
  Programmatic: 'Programmatic',
  Utility: 'Utility',
  GameDesign: 'GameDesign',
};

export const editorTabsTranslationsEN = {
  miscellaneous: {
    noAvailableTabs:
      'No tab available. You should try to change you role in the top left admin menu',
  },
  tabsNames: {
    Tester: 'Tester',
    Variables: 'Variables',
    'State Machine': 'State Machine',
    'Variable Properties': 'Variables Properties',
    Files: 'Files',
    Scripts: 'Scripts',
    Styles: 'Styles',
    Client: 'Client',
    Server: 'Server',
    AllLibs: 'All Libraries',
    Consoles: 'Consoles',
    'Client Console': 'Client Console',
    'Server Console': 'Server Console',
    'Instances Editor': 'Instances Editor',
    'Theme Editor': 'Theme Editor',
    Theme: 'Theme',
    Preview: 'Preview',
    Modes: 'Modes',
    Pages: 'Pages',
    'Component Palette': 'Component Palette',
    'Page Display': 'Page Display',
    'Pages Layout': 'Pages Layout',
    'Source Editor': 'Source Editor',
    'Component Properties': 'Component Properties',
    Languages: 'Languages',
    'Language editor': 'Language editor',
    'Translation manager': 'Translation manager',
    'Scenarist pages': 'Scenarist pages',
    'Peer reviews': 'Peer reviews',
  },
  stateMachine: {
    selectVariable: 'Select a state-machine or a dialogue to display',
    selectedNotStateMachine:
      'The selected variable is not some kind of state machine',
  },
  fileBrowser: {
    fileInsertFailed: 'File insertion failed',
    overrideFile: (fileName: string) =>
      `Are you sure that you want to override the file [${fileName}]?`,
    deleteFolder:
      'Are you sure to delete the folder and all its subdirectories ?',
    uploadNew: 'Upload new version',
    uploadFile: 'Upload file',
    uploadFileFolder: 'Upload file in the folder',
    addNewFolder: 'Add new folder',
    newFolder: 'New folder',
    newPage: 'New page',
    pageName: 'Page name',
    folderName: 'Folder name',
    itemMustName: (item?: string) =>
      `The ${item ? item : 'item'} must have a name`,
    page: 'page',
    folder: 'folder',
    openFile: 'Open file',
    changeType: (fromFileType: string, toFileType: string) =>
      `Are you sure that you want to change the file type from ${fromFileType} to ${toFileType}?`,
    directoryName: 'Directory name',
    uploading: (nbUploadingFiles: string) =>
      `Uploading ${nbUploadingFiles} files`,
    directory: (directoryName: string) =>
      `Directory ${directoryName} allready exists`,
  },
  scripts: {
    scriptNameNotAvailable:
      'Script name not available (script already exists or the name contains bad characters)',
    scriptFolderNotAvailable: 'Folder already exists',
    cannotCreateScript: 'Cannot create the script',
    cannotDeleteScript: 'Cannot delete the script',
    cannotGetScripts: 'Cannot get the scripts',
    librarySavedErrors:
      'The library has been saved but the script contains errors',
    libraryIsOutdated:
      'The library is outdated and cannot be saved. Try again or merge it.',
    libraryCannotDelete: 'The library cannot be deleted',
    libraryName: 'Library name',
    libraryMustName: 'The library must have a name',
    addNewScript: 'Add a new script',
    noLibrarySelected: 'No library selected',
    saveScript: 'Save the script',
    deleteScript: 'Delete the script',
    downloadScript: 'Download the script',
    scriptDangerOutdate: 'The script is dangeroulsy outdated!',
    scriptNotSaved: 'The script is not saved',
    scriptSaved: 'The script is saved',
    createLibraryPlease: 'Please create a library by pressing the + button',
    canntoBeParsed: 'The script cannot be parsed',
    canntoBeParsedCondition: 'The script cannot be parsed as a condition',
  },
  instanceProps: {
    noDescriptorEdited: 'No descriptor is beeing edited',
    currentGameModel: 'Current game model',
  },
  themeEditor: {
    contexts: 'Contexts',
    themeNameVal: (name: string) => `${name}'s theme :`,
    themeAlreadyExists: 'The theme already exists',
    theme: (t: string) => `Theme: ${t}`,
    themeName: 'Theme Name',
    addTheme: 'Add a theme',
    deleteTheme: 'Delete theme',
    modeAlreadyExists: 'The mode already exists',
    mode: (m: string) => `Mode: ${m}`,
    modeName: 'Mode name',
    addMode: 'Add a mode',
    showSection: 'Show section',
    primaryColors: 'Primary colors',
    secondaryColors: 'Secondary colors',
    backgroundColors: 'Background colors',
    textColors: 'Text colors',
    otherColors: 'Other colors',
    previewPage: 'Preview page',
    componentState: 'Components state',
    someText: 'Some text',
    clickMe: 'Click me',
    nextMode: 'Next mode : ',
    deleteMode: 'Delete mode',
    setMainMode: 'Set as main mode',
    states: (state: string) => {
      if (state === 'disabled') return 'Disabled';
      else if (state === 'readOnly') return 'Read only';
      else return state;
    },
    sections: (section: string) => {
      switch (section) {
        case 'colors':
          return 'Colors';
        case 'dimensions':
          return 'Dimensions';
        case 'others':
          return 'Others';
        default:
          return section;
      }
    },
    themeColorShades: {
      main: 'Main',
      tint: 'Tint',
      shade: 'Shade',
      pastel: 'Pastel',
      secondary: 'Secondary',
      dark: 'Dark',
      'dark secondary': 'Dark Secondary',
      'Accent color': 'Accent color',
      'Disabled color': 'Disabled color',
      'Error color': 'Error color',
      'Warning color': 'Warning color',
      'Success color': 'Success color',
    },
  },
  pageEditor: {
    showControls: 'Show controls: ',
    editMode: 'Edit mode: ',
    toggleBorders: 'Toggle borders: ',
    unknownComponent: 'Unknown component',
    addComponent: 'Add a component',
    firstCompoNotDeleted: 'The first component of a page connot be deleted',
    deleteComponent: 'Delete the component',
    copyComponent: 'Copy the component',
    adddNewPageFolder: 'Add new page or folder',
    defaultPage: 'Default page',
    scenaristPage: 'Scenarist page',
    trainerPage: 'Trainer page',
    folderMustEmpty: 'The folder must be empty to delete it',
    deletePageOrFolder: (item: string) => `Delete the ${item}`,
    editorMustEnabled: 'Edit mode must be enabled to use the palette.',
    enableEditMode: 'Enable edit mode',
    back: 'Back',
    componentTypes: compTypes,
  },
  languageEditor: {
    languages: 'Languages',
  },
  variableProperties: {
    toggleCoding: 'Toggle coding console',
    runScripts: 'Run scripts',
    deleteGroup: 'Delete this group',
  },
};
