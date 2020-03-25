import * as React from 'react';
import { Menu } from '../Menu';

const availableFeatures: FeatureLevel[] = ['ADVANCED', 'INTERNAL'];
export const featuresCTX = React.createContext<{
  currentFeatures: FeatureLevel[];
  setFeature: (feature: FeatureLevel) => void;
  removeFeature: (feature: FeatureLevel) => void;
}>({ currentFeatures: [], setFeature: () => {}, removeFeature: () => {} });

function FeaturesContext({ children }: React.PropsWithChildren<{}>) {
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
/**
 * Provider for FeatureContext Handles display features
 */
export const FeaturesProvider = React.memo(FeaturesContext);

/**
 * Features selector allows to select features inside the feature context given by the FeatureProvider
 */
export function FeatureToggler() {
  const { currentFeatures, setFeature, removeFeature } = React.useContext(
    featuresCTX,
  );

  const selectFeature = React.useCallback(
    (feature: FeatureLevel) => {
      if (currentFeatures.includes(feature)) {
        removeFeature(feature);
      } else {
        setFeature(feature);
      }
    },
    [currentFeatures, setFeature, removeFeature],
  );

  return React.useMemo(
    () => (
      <Menu
        label={'Features'}
        items={availableFeatures.map(feature => ({
          id: feature,
          label: (
            <>
              <input
                type="checkbox"
                defaultChecked={currentFeatures.includes(feature)}
                onChange={() => selectFeature(feature)}
                onClick={e => e.stopPropagation()}
              />
              {feature}
            </>
          ),
        }))}
        onSelect={({ id: feature }) => selectFeature(feature)}
      />
    ),
    [currentFeatures, selectFeature],
  );
}
