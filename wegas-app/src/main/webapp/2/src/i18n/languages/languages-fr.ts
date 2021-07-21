import { LanguagesTranslations } from './definitions';

export const languagesTranslationsFR: LanguagesTranslations = {
  warningCopy: (from: string, to: string) =>
    `Êtes-vous sur de vouloir copier les traduction de ${from} vers ${to}? Les traduction actuelles seront écrasées!`,
  warningDelete: (language: string, outdated: boolean) =>
    `Êtes-vous sur de vouloir supprimer toutes les traductions ${
      outdated ? 'obsolètes ' : ''
    } de ${language}?`,
  outdated: 'obsolète',
  clearTranslations: 'Supprimer les traductions',
  outdatedTranslations: 'Traductions obsolètes',
  allTranslations: 'Toutes les traductions',
  copyTranslations: 'Copier les traductions',
};
