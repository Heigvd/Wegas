interface FeaturesSelecta {
  ADVANCED?: boolean;
  INTERNAL?: boolean;
  DEFAULT?: boolean;
  MODELER?: boolean;
}

type FeatureLevel = keyof FeaturesSelecta;

interface GlobalEditorClass {
  getFeatures: () => FeaturesSelecta;
  setFeatures: (features: FeaturesSelecta) => void;
  getLanguage: () => IGameModelLanguage | undefined;
  setLanguage: (lang: { code: IGameModelLanguage['code'] } | string) => void;
  getPageLoaders: () => { [name: string]: string };
  setPageLoader: (name: string, pageId: string) => void;
}
