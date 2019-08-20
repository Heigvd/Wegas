import * as React from 'react';
import { FeatureLevel } from '../Editor/Components/FormView/commonView';

export const availableFeatures: FeatureLevel[] = ['ADVANCED', 'INTERNAL'];
export const featuresCTX = React.createContext<{
  currentFeatures: FeatureLevel[];
  setFeature: (feature: FeatureLevel) => void;
  removeFeature: (feature: FeatureLevel) => void;
}>({ currentFeatures: [], setFeature: () => {}, removeFeature: () => {} });

function FeatureContext({ children }: React.PropsWithChildren<{}>) {
  const [features, setFeature] = React.useState<FeatureLevel[]>(['DEFAULT']);
  return (
    <featuresCTX.Provider
      value={{
        currentFeatures: features,
        setFeature: feature =>
          setFeature(oldFeatures => [...oldFeatures, feature]),
        removeFeature: feature =>
          setFeature(oldFeatures =>
            oldFeatures.filter(feat => feat !== feature),
          ),
      }}
    >
      {children}
    </featuresCTX.Provider>
  );
}

export const FeatureProvider = React.memo(FeatureContext);
