import { LanguagesTranslations } from './definitions';

export const languagesTranslationsEN: LanguagesTranslations = {
  warningCopy: (from: string, to: string) =>
    `Are you sure that you want to copy translations from ${from} to ${to}? Translations will be overriden!`,
  warningDelete: (language: string, outdated: boolean) =>
    `Are you sure that you want to delete all ${
      outdated ? 'outdated ' : ''
    }translations of ${language}?`,
  outdated: 'outdated',
  clearTranslations: 'Clear translations',
  outdatedTranslations: 'Outdated translations',
  allTranslations: 'All translations',
  copyTranslations: 'Copy translations',
};
