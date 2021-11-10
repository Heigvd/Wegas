import { LanguagesTranslations } from './definitions';

export const languagesTranslationsIT: LanguagesTranslations = {
  warningCopy: (from: string, to: string) =>
    `Sei sicuro di voler copiare le traduzioni da ${from} a ${to}. Le traduzioni saranno sovrascritte!`,
  warningDelete: (language: string, outdated: boolean) =>
    `Sei sicuro di voler eliminare tutte le traduzioni ${
      outdated ? 'obsolete ' : ''
    } di ${language}?`,
  outdated: 'obsoleto',
  upToDate: 'aggiornato',
  saveTranslations: 'Salvare le traduzioni',
  clearTranslations: 'Cancellare le traduzioni',
  outdatedTranslations: 'Traduzioni obsolete',
  allTranslations: 'Tutte le traduzioni',
  translateFrom: 'Tradurre da',
  copyTranslations: 'Copiare le traduzioni',
  CONTENT_EDITOR: 'Editore di contenuti',
  SCENARIO_EDITOR: 'Editore di scenario',
  translationManagement: 'Gestione delle traduzioni',
  outdateOtherLanguages: 'Superare le altre lingue',
  markAsOutdated: 'Impostare obsoleto',
  markAsUpToDate: 'Impostare aggiornato',
  undoModifications: 'Annullare le modifiche',
  saveModifications: 'Salvare le modifiche',
  hideOptions: 'Nascondi opzioni',
  showOptions: 'Mostra opzioni',
};
