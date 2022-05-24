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
  forEach: {
    noItems: "Le composant n'a reçu aucun tableau d'item",
    noKey: index => `L'item n'a pas de clé à la position #${index}`,
  },
  missingProperty: propName => `La propriété "${propName}" n'est pas définie`,
};
