import { LanguagesTranslations } from './definitions';

export const languagesTranslationsDE: LanguagesTranslations = {
  warningCopy: (from: string, to: string) =>
    `Sind Sie sicher, dass Sie die Übersetzungen von ${from} nach ${to} kopieren möchten? Die Übersetzungen werden überschrieben!`,
  warningDelete: (language: string, outdated: boolean) =>
    `Sind Sie sicher, dass Sie alle ${
      outdated ? 'veralteten ' : ''
    } Übersetzungen von ${language} löschen möchten?`,
  outdated: 'veraltet',
  upToDate: 'gültig',
  saveTranslations: 'Übersetzung speichern',
  clearTranslations: 'Übersetzungen löschen',
  outdatedTranslations: 'Veraltete Übersetzungen',
  allTranslations: 'Alle Übersetzungen',
  translateFrom: 'Übersetzen von',
  copyFrom: 'Kopieren von',
  CONTENT_EDITOR: 'Redakteur für Inhalte',
  SCENARIO_EDITOR: 'Redakteur für Szenario',
  translationManagement: 'Übersetzungsmanagement',
  outdateOtherLanguages: 'Andere Sprachen überholen',
  markAsOutdated: 'Als veraltet markieren',
  markAsUpToDate: 'Als g!ultig markieren',
  undoModifications: 'Änderungen zurücknehmen',
  saveModifications: 'Änderungen speichern',
  hideOptions: 'Optionen ausblenden',
  showOptions: 'Optionen anzeigen',
};
