import { LanguagesTranslations } from './definitions';

export const languagesTranslationsFR: LanguagesTranslations = {
  warningCopy: (from: string, to: string) =>
    `Êtes-vous sur de vouloir copier les traduction de ${from} vers ${to}? Les traduction actuelles seront écrasées!`,
  warningDelete: (language: string, outdated: boolean) =>
    `Êtes-vous sur de vouloir supprimer toutes les traductions ${
      outdated ? 'obsolètes ' : ''
    } de ${language}?`,
  outdated: 'obsolète',
  upToDate: 'a jour',
  noTranslation: 'aucune traduction',
  saveTranslations: 'Sauvegarder les traductions',
  clearTranslations: 'Supprimer les traductions',
  outdatedTranslations: 'Traductions obsolètes',
  allTranslations: 'Toutes les traductions',
  translateFrom: 'Traduire depuis',
  translateWithDeepl: 'Traduire avec DeepL',
  copyFrom: 'Copier à partir de',
  CONTENT_EDITOR: 'Editeur de contenu',
  SCENARIO_EDITOR: 'Editeur de scénario',
  translationManagement: 'Gestion de la traduction',
  outdateOtherLanguages: 'Rendre les autres langues dépassés',
  markAsOutdated: 'Marquer comme dépassé',
  markAsUpToDate: 'Marquer comme à jour',
  undoModifications: 'Annuler les modifications',
  saveModifications: 'Sauvegarder les modifications',
  hideOptions: 'Masquer options',
  showOptions: 'Montrer options',
};
