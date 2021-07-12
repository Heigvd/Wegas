import { LanguagesTranslations } from './definitions';

export const languagesTranslationsIT: LanguagesTranslations = {
  warningCopy: (from: string, to: string) =>
    `Sei sicuro di voler copiare le traduzioni da ${from} a ${to}. Le traduzioni saranno sovrascritte!`,
  warningDelete: (language: string, outdated: boolean) =>
    `Sei sicuro di voler eliminare tutte le traduzioni ${
      outdated ? 'obsolete ' : ''
    } di ${language}?`,
  outdated: 'obsolete',
  clearTranslations: 'Cancellare le traduzioni',
  outdatedTranslations: 'Traduzioni obsolete',
  allTranslations: 'Tutte le traduzioni',
  copyTranslations: 'Copiare le traduzioni',
};
