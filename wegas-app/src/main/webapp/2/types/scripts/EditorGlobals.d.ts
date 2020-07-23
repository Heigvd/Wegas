type IGameModelLanguage = import('wegas-ts-api/typings/WegasEntities').IGameModelLanguage;

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
}
