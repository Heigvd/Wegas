import { AuthorizationData } from '../../Components/Contexts/AuthorizationsProvider';

export interface CommonTranslations {
  newChanges: string;
  changesNotSaved: string;
  changesSaved: string;
  changesWillBeLost: string;
  whatDoYouWantToDo: string;
  areYouSure: string;
  loading: string;
  loadingFiles: string;
  someWentWrong: string;
  accept: string;
  cancel: string;
  delete: string;
  reset: string;
  restart: string;
  save: string;
  doNotSave: string;
  edit: string;
  duplicate: string;
  close: string;
  add: string;
  filter: string;
  empty: string;
  forceDelete: string;
  seeChanges: string;
  buildingWorld: string;
  features: string;
  language: string;
  deepSearch: string;
  addVariable: string;
  role: string;
  header: {
    hide: string;
    show: string;
    restartGame: string;
    restartRealGame: string;
    resetLayout: string;
    notifications: string;
    teams: string;
    addExtraTestPlayer: string;
  };
  noContent: string;
  noSelectedTab: string;
  serverDown: string;
  serverOutaded: string;
  somethingIsUndefined: (name: string) => string;
  authorizations: {
    authorize: string;
    refuse: string;
    authorizationsText: string;
    authorizationNeeded: string;
    authorizationRefused: string;
    resetAllAuthorizations: string;
    authorizations: {
      [key in keyof AuthorizationData]: { label: string; description: string };
    };
  };
  qrCode: {
    notAuthorizedToUseCamera :string;
    tabSetting: string;
    iOSSettingsHint: (navigator: string) => string;
    androidSettingsHint: (navigator: string) => string;
  }
}
