import { PagesTranslations } from './definitions';

export const pagesTranslationsEN: PagesTranslations = {
  noDefaultPages: 'There is no main page. Please choose a page',
  noPages: 'The scenario does not have any pages, please add a new page',
  loadingPages: 'Loading the pages',
  noSelectedPage: 'No selected page',
  pageUndefined: 'The page is undefined',
  completeCompConfig:
    'Please complete the component configuration for it to be displayed.',
  editComponent: 'Edit component',
  obsoleteComponent:
    'The component has been updated. Please contact your trainer.',
  forEach: {
    noItems: 'The component did not receive any array of items',
    noKey: index => `The key is missing for item #${index}`,
  },
  missingProperty: propName => `The property "${propName}" is missing`,
};
