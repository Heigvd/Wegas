import * as React from 'react';
import { Menu } from './Menu';
import { FeatureLevel } from './Hooks/types/scriptEditorGlobals';

const availableFeatures: FeatureLevel[] = ['ADVANCED', 'INTERNAL'];
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
/**
 * Provider for FeatureContext Handles display features
 */
export const FeatureProvider = React.memo(FeatureContext);

/**
 * Features selector allows to select features inside the feature context given by the FeatureProvider
 */

export function FeatureToggler() {
  const { currentFeatures, setFeature, removeFeature } = React.useContext(
    featuresCTX,
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
                onChange={e => {
                  if (e.target.checked) {
                    setFeature(feature);
                  } else {
                    removeFeature(feature);
                  }
                }}
                onClick={e => e.stopPropagation()}
              />
              {feature}
            </>
          ),
        }))}
        onSelect={() => {}}
      />
    ),
    [currentFeatures, removeFeature, setFeature],
  );
}
