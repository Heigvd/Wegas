import { PagesTranslations } from './definitions';

export const pagesTranslationsDE: PagesTranslations = {
  noDefaultPages: 'Es gibt keine Hauptseite. Bitte wählen Sie eine Seite',
  noPages:
    'Das Szenario hat keine Seiten, bitte fügen Sie eine neue Seite hinzu',
  loadingPages: 'Laden der Seiten',
  noSelectedPage: 'Keine gewählte Seite',
  pageUndefined: 'Die Seite ist undefiniert',
  completeCompConfig:
    'Bitte vervollständigen Sie die Komponentenkonfiguration, damit sie angezeigt wird.',
  editComponent: 'Komponente editieren',
  obsoleteComponent:
    'Die Komponente wurde aktualisiert. Bitte kontaktieren Sie Ihren Trainer.',
  allowExternalSources:
    'Sie möchten Open Street Map-Daten verwenden. Sie sind dabei, mit dem OSM-Server zu kommunizieren. Sind Sie mit dieser Aktion einverstanden?',
  externalSourcesRefused:
    'Sie können diese Komponente nicht verwenden, weil Sie die Kommunikation mit einem externen Server abgelehnt haben. Wenn Sie Ihre Meinung ändern möchten, können Sie jederzeit die Schaltfläche "Akzeptieren" unten verwenden.',
  forEach: {
    noItems: 'Die Komponente hat kein Array von item erhalten',
    noKey: index => `Es fehlt der item für die Position #${index}`,
  },
  missingProperty: propName => `Es fehlt die Eigenschaft "${propName}"`,
};
