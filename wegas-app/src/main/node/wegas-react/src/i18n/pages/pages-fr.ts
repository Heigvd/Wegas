import { PagesTranslations } from './definitions';

export const pagesTranslationsFR: PagesTranslations = {
  noDefaultPages:
    "Il n'y a pas de page principale. Veuillez selectionner une page",
  noPages: 'Le scenario ne contient aucune page, veuillez en ajouter une',
  loadingPages: 'Chargement des pages',
  noSelectedPage: 'Aucune page sélectionnée',
  pageUndefined: "La page n'est pas définie",
  completeCompConfig:
    "Veuillez terminer la configuration du composant pour qu'il s'affiche..",
  editComponent: 'Editer le componsant',
  obsoleteComponent:
    'Le composant a été mis a jour. Veuillez contacter votre formateur.',
  allowExternalSources:
    "Vous choisissez d'utiliser les données d'Open Street Map. Vous êtes sur le point de communiquer avec le serveur OSM, autorisez-vous cette action ?",
  externalSourcesRefused:
    'Vous ne pouvez pas utiliser ce composant car vous avez refusé de communiquer avec un serveur externe. Si vous souhaitez changer d\'avis, vous pouvez toujours utiliser le bouton "Accepter" ci-dessous.',
  forEach: {
    noItems: "Le composant n'a reçu aucun tableau d'item",
    noKey: index => `L'item n'a pas de clé à la position #${index}`,
  },
  missingProperty: propName => `La propriété "${propName}" n'est pas définie`,
};
