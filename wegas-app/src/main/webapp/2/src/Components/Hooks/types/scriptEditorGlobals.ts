export interface FeaturesSelecta {
  ADVANCED?: boolean;
  INTERNAL?: boolean;
  DEFAULT?: boolean;
}

export type FeatureLevel = keyof FeaturesSelecta;

export interface GlobalEditorClass {
  getFeatures: () => FeaturesSelecta;
  setFeatures: (features: FeaturesSelecta) => void;
  getLanguage: () => ISGameModelLanguage | undefined;
  setLanguage: (lang: { code: ISGameModelLanguage['code'] } | string) => void;
}
