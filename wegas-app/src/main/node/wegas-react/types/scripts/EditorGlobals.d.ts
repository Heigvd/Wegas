interface FeaturesSelecta {
  ADVANCED?: boolean;
  INTERNAL?: boolean;
  DEFAULT?: boolean;
}

type FeatureLevel = keyof FeaturesSelecta;

interface GlobalEditorClass {
  getFeatures: () => FeaturesSelecta;
  setFeatures: (features: FeaturesSelecta) => void;
  getLanguage: () => IGameModelLanguage | undefined;
  setLanguage: (lang: { code: IGameModelLanguage['code'] } | string) => void;
  getPageLoaders: () => { [name: string]: number };
  setPageLoader: (name: string, pageId: number) => void;
}
