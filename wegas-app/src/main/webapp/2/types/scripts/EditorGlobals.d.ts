interface FeaturesSelecta {
  ADVANCED?: boolean;
  INTERNAL?: boolean;
  DEFAULT?: boolean;
}

type FeatureLevel = keyof FeaturesSelecta;

interface GlobalEditorClass {
  getFeatures: () => FeaturesSelecta;
  setFeatures: (features: FeaturesSelecta) => void;
  getLanguage: () => ISGameModelLanguage | undefined;
  setLanguage: (lang: { code: ISGameModelLanguage['code'] } | string) => void;
}
