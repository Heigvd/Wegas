import { CommonTranslations } from './definitions';

export const commonTranslationsIT: CommonTranslations = {
  newChanges: 'nuove modifiche!',
  changesNotSaved: 'Modifiche non salvate',
  changesSaved: 'Modifiche salvate',
  changesWillBeLost: 'I cambiamenti andranno persi.',
  areYouSure: 'Sei sicuro di voler continuare?',
  whatDoYouWantToDo: 'Che cosa voi fare',
  loading: 'Caricamento',
  loadingFiles: 'Caricare i file',
  someWentWrong: 'Qualcosa è andato storto',
  accept: 'Accettare',
  cancel: 'Cancellare',
  delete: 'Cancellare',
  reset: 'resettare',
  restart: 'Riavviare',
  save: 'Salva',
  doNotSave: 'Non salvare',
  edit: 'Modifica',
  duplicate: 'Duplicato',
  close: 'Chiudere',
  add: 'Aggiungere',
  filter: 'Filtro',
  empty: 'Vuoto',
  forceDelete: 'Forzare la cancellazione',
  seeChanges: 'Vedere le modifiche',
  buildingWorld: 'Il mondo è in costruzione!',
  features: 'Caratteristiche',
  language: 'Lingua',
  deepSearch: 'Ricerca profonda',
  addVariable: 'Aggiungere una nuova variabile',
  role: 'Ruolo utente',
  header: {
    hide: 'Nascondi intestazione',
    show: 'Montare la intestazione',
    restartGame: 'Riavviare il gioco (applicato ad ogni scenarista)',
    restartRealGame:
      'ATTENZIONE, state per riavviare un gioco vero e proprio. Tutte le squadre saranno azzerate.',
    resetLayout: 'Ripristinare il layout',
    notifications: 'Notifiche',
    teams: 'Squadre',
    addExtraTestPlayer: 'Aggiungi un test giocatore',
  },
  noContent: 'Nessun contenuto',
  noSelectedTab: 'Nessun tab selezionato',
  serverDown: 'Riconnessione...',
  serverOutaded:
    'La sua versione di Wegas non è aggiornata, aggiorna il suo browser.',
  somethingIsUndefined: name => `${name} è indefinito`,
  authorizations: {
    authorize: 'Autorizza',
    refuse: 'Rifiuta',
    authorizationsText: 'Autorizzazioni',
    authorizationNeeded: 'Autorizzazione necessaria',
    authorizationRefused:
      "Il componente non può essere visualizzato perché l'autorizzazione è stata rifiutata.",
    resetAllAuthorizations: 'Reimposta tutte le autorizzazioni',
    authorizations: {
      allowExternalUrl: {
        label: "Consentire l'accesso a URL esterni",
        description:
          "L'utente accetta di rendere disponibile il proprio indirizzo IP ad altri siti web in modo che Wegas possa ottenere risorse esterne (font, immagini, mappe, ecc.).",
      },
    },
  },
  qrCode: {
    notAuthorizedToUseCamera : "L'accesso alla telecamera è proibito",
    tabSetting: 'Controllare se la telecamera è stata bloccata (icona della telecamera nella barra degli indirizzi).',
    iOSSettingsHint: (navigator: string) => `Controllare le configurazioni dell'iPad/iPhone (Configurazioni / ${navigator})`,
    androidSettingsHint: (navigator: string) => `Controllare le impostazioni del proprio smartphone/tablet (Impostazioni / Applicazioni / ${ navigator
} / Autorizzazioni / Fotocamera`
  },
};
