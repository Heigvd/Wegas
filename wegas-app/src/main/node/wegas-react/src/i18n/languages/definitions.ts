export interface LanguagesTranslations {
  warningCopy: (from: string, to: string) => string;
  warningDelete: (language: string, outdated: boolean) => string;
  outdated: string;
  upToDate: string;
  noTranslation: string;
  saveTranslations: string;
  clearTranslations: string;
  outdatedTranslations: string;
  allTranslations: string;
  translateFrom: string;
  translateWithDeepl: string;
  copyFrom: string;
  CONTENT_EDITOR: string;
  SCENARIO_EDITOR: string;
  translationManagement: string;
  outdateOtherLanguages: string;
  markAsOutdated: string;
  markAsUpToDate: string;
  undoModifications: string;
  saveModifications: string;
  hideOptions: string;
  showOptions: string;
}
