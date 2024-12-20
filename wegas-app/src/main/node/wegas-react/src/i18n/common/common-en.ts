import { CommonTranslations } from './definitions';

export const commonTranslationsEN: CommonTranslations = {
  newChanges: 'New changes!',
  changesNotSaved: 'Changes not saved!',
  changesSaved: 'Changes  saved',
  changesWillBeLost: 'The changes will be lost.',
  areYouSure: 'Are you sure you want to continue?',
  whatDoYouWantToDo: 'What do you want to do?',
  loading: 'Loading',
  loadingFiles: 'Loading files...',
  someWentWrong: 'Something went wrong',
  accept: 'Accept',
  cancel: 'Cancel',
  delete: 'Delete',
  reset: 'Reset',
  restart: 'Restart',
  save: 'Save',
  doNotSave: 'Do not save',
  edit: 'Edit',
  duplicate: 'Duplicate',
  close: 'Close',
  add: 'Add',
  filter: 'Filter',
  empty: 'Empty',
  forceDelete: 'Force delete',
  seeChanges: 'See changes',
  buildingWorld: 'Building world!',
  features: 'Features',
  language: 'Language',
  deepSearch: 'Deep search',
  addVariable: 'Add new variable',
  role: 'User role',
  header: {
    hide: 'Hide header',
    show: 'Show header',
    restartGame: 'Restart the game (applied to every scenarist)',
    restartRealGame:
      "BE CAREFUL, you're about to restart a real game. All teams will be reset.",
    resetLayout: 'Reset layout',
    notifications: 'Notifications',
    teams: 'Teams',
    addExtraTestPlayer: 'Add a test player',
  },
  noContent: 'No content',
  noSelectedTab: 'No selected tab',
  serverDown: 'Reconnecting...',
  serverOutaded:
    'Your version of Wegas is not up to date, please refresh your browser.',
  somethingIsUndefined: name => `${name} is undefined`,
  authorizations: {
    authorize: 'Authorize',
    refuse: 'Refuse',
    authorizationsText: 'Authorizations',
    authorizationNeeded: 'Authorization needed',
    authorizationRefused:
      'The component cannot be displayed because the authorization has been refused',
    resetAllAuthorizations: 'Reset all authorizations',
    authorizations: {
      allowExternalUrl: {
        label: 'Authorize access to external URLs',
        description:
          'You agree to expose your IP address to other websites so that wegas can obtain external resources (fonts, images, maps, etc...)',
      },
    },
  },
  qrCode: {
    notAuthorizedToUseCamera : "Access to camera is forbidden",
    tabSetting: "Check if you've blocked the camera (camera icon in the address bar)",
    iOSSettingsHint: (navigator: string) => `Check you iPad/iPhone settings (Settings / ${navigator})`,
    androidSettingsHint: (navigator: string) => `Check your smartphone/tablet settings (Settings / Applications / ${navigator} / Authorizations / Camera)`
  },
};
