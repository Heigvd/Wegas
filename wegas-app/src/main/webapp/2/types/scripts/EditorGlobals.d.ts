type IGameModelLanguage = import('wegas-ts-api').IGameModelLanguage;
type IScript = import('wegas-ts-api').IScript;

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
