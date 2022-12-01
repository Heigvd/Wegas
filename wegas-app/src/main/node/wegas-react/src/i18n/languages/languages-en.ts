import { LanguagesTranslations } from './definitions';

export const languagesTranslationsEN: LanguagesTranslations = {
  warningCopy: (from: string, to: string) =>
    `Are you sure that you want to copy translations from ${from} to ${to}? Translations will be overriden!`,
  warningDelete: (language: string, outdated: boolean) =>
    `Are you sure that you want to delete all ${
      outdated ? 'outdated ' : ''
    }translations of ${language}?`,
  outdated: 'outdated',
  upToDate: 'up to date',
  noTranslation: 'no translation',
  saveTranslations: 'Save translations',
  clearTranslations: 'Clear translations',
  outdatedTranslations: 'Outdated translations',
  allTranslations: 'All translations',
  translateFrom: 'Translate from',
  translateWithDeepl: 'Translate with DeepL',
  copyFrom: 'Copy from',
  CONTENT_EDITOR: 'Content editor',
  SCENARIO_EDITOR: 'Scenario editor',
  translationManagement: 'Translation management',
  outdateOtherLanguages: 'Outdate other languages',
  markAsOutdated: 'Mark as outdated',
  markAsUpToDate: 'Mark as up to date',
  undoModifications: 'Undo modifications',
  saveModifications: 'Save modifications',
  hideOptions: 'Hide options',
  showOptions: 'Show options',
};
