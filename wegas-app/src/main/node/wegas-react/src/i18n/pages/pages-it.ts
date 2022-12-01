import { PagesTranslations } from './definitions';

export const pagesTranslationsIT: PagesTranslations = {
  noDefaultPages:
    "Non c'è una pagina principale. Si prega di scegliere una pagina",
  noPages: 'Lo scenario non ha pagine, si prega di aggiungere una nuova pagina',
  loadingPages: 'Caricare le pagine',
  noSelectedPage: 'Nessuna pagina selezionata',
  pageUndefined: 'La pagina non è definita',
  completeCompConfig:
    'Completare la configurazione del componente per visualizzarlo.',
  editComponent: 'Modifica componente',
  obsoleteComponent:
    'Il componente è stato aggiornato. Contatta il tuo trainer.',
  forEach: {
    noItems: 'Il componente non ha ricevuto alcun array di items',
    noKey: index => `Manca la key per l'item #${index}`,
  },
  missingProperty: propName => `Manca la proprietà "${propName}"`,
};
