export interface LanguagesTranslations {
  warningCopy: (from: string, to: string) => string;
  warningDelete: (language: string, outdated: boolean) => string;
  outdated: string;
  upToDate: string;
  saveTranslations: string;
  clearTranslations: string;
  outdatedTranslations: string;
  allTranslations: string;
  copyTranslations: string;
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
