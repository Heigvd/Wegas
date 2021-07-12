export interface LanguagesTranslations {
  warningCopy: (from: string, to: string) => string;
  warningDelete: (language: string, outdated: boolean) => string;
  outdated: string;
  clearTranslations: string;
  outdatedTranslations: string;
  allTranslations: string;
  copyTranslations: string;
}
