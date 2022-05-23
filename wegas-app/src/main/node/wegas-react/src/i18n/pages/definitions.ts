export interface PagesTranslations {
  noDefaultPages: string;
  noPages: string;
  loadingPages: string;
  noSelectedPage: string;
  pageUndefined: string;
  completeCompConfig: string;
  editComponent: string;
  obsoleteComponent: string;
  allowExternalSources: string;
  externalSourcesRefused: string;
  forEach: {
    noItems: string;
    noKey: (index: number) => string;
  };
  missingProperty: (propName: string) => string;
}
