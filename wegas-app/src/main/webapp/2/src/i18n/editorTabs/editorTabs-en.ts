import { EditorTabsTranslations } from './definitions';

export const editorTabsTranslationsEN: EditorTabsTranslations = {
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
    'Language Editor': 'Language Editor',
    'Client Console':  'Client Console',
    'Server Console': 'Server Console',
    'Instances Editor': 'Instances Editor',
    'Theme Editor': 'Theme Editor',
    Theme: 'Theme',
    Preview: 'Preview',
    Modes: 'Modes',
    'Page Editor': 'Page Editor',
    'Component Palette': 'Component Palette',
    'Page Display': 'Page Display',
    'Pages Layout': 'Pages Layout',
    'Source Editor': 'Source Editor',
    'Component Properties': 'Component Properties',
  },
  stateMachine: {
    selectVariable: 'Select a variable to display',
    selectedNotStateMachine: 'The selected variable is not some kind of state machine',
  },
  fileBrowser: {
    fileInsertFailed: 'File insertion failed',
    overrideFile: (fileName) => `Are you sure that you want to override the file [${fileName}]?`,
    deleteFolder: 'Are you sure to delete the folder and all its subdirectories ?',
    uploadNew: 'Upload new version',
    uploadFile: 'Upload file',
    uploadFileFolder: 'Upload file in the folder',
    addNewFolder: 'Add new folder',
    newFolder: 'New folder',
    newPage: 'New page',
    pageName: 'Page name',
    folderName: 'Folder name',
    itemMustName: (item) => `The ${item ? item : 'item'} must have a name`,
    page: 'page',
    folder: 'folder',
    openFile: 'Open file',
    changeType: (fromFileType, toFileType) => `Are you sure that you want to change the file type from ${fromFileType} to ${toFileType}?`,
    directoryName: 'Directory name',
    uploading: (nbUploadingFiles) => `Uploading ${nbUploadingFiles} files`,
    directory: (directoryName) => `Directory ${directoryName} allready exists`,
  },
  scripts: {
    scriptNameNotAvailable: 'Script name not available (script already exists or the name contains bad characters)',
    cannotCreateScript:  'Cannot create the script',
    cannotDeleteScript:  'Cannot delete the script',
    cannotGetScripts: 'Cannot get the scripts',
    librarySavedErrors: 'The library has been saved but the script contains errors',
    libraryCannotSave: 'The library cannot be saved',
    libraryCannotDelete:  'The library cannot be deleted',
    libraryName: 'Library name',
    libraryMustName: 'The library must have a name',
    addNewScript: 'Add a new script',
    noLibrarySelected: 'No library selected',
    saveScript: 'Save the script',
    deleteScript: 'Delete the script',
    scriptDangerOutdate: 'The script is dangeroulsy outdated!',
    scriptNotSaved: 'The script is not saved',
    scriptSaved: 'The script is saved',
    createLibraryPlease: 'Please create a library by pressing the + button',
  },
  instanceProps: {
    noDescriptorEdited: 'No descriptor is beeing edited',
    currentGameModel: 'Current game model',
  },
  themeEditor: {
    contexts: 'Contexts',
    themeNameVal: (name) => `${name}'s theme :`,
    themeAlreadyExists: 'The theme already exists',
    theme: (t) => `Theme: ${t}`,
    themeName: 'Theme Name',
    addTheme: 'Add a theme',
    modeAlreadyExists: 'The mode already exists',
    mode: (m) => `Mode: ${m}`,
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
    states: (state) => {
      if(state === 'disabled')return 'Disabled';
      else if(state === 'readOnly')return 'Read only';
      else return state;
    },
    sections: (section) => {
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
    }
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
    adddNewPageFolder: "Add new page or folder",
    defaultPage: 'Default page',
    scenaristPage: 'Scenarist page',
    trainerPage: 'Trainer page',
    folderMustEmpty: 'The folder must be empty to delete it',
    deletePageOrFolder: (item)=>`Delete the ${item}`,
    editorMustEnabled: 'Edit mode must be enabled to use the palette.',
    enableEditMode: 'Enable edit mode',
    back: 'Back',
    componentTypes: {
      Other: 'Other',
      Layout: 'Layout',
      Input: 'Input',
      Output: 'Output',
      Advanced: 'Advanced',
      Programmatic: 'Programmatic',
    }
  }
};
