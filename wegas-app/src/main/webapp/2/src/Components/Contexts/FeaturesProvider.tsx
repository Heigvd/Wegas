import * as React from 'react';
import { DropMenu } from '../DropMenu';

const availableFeatures: FeatureLevel[] = ['ADVANCED', 'INTERNAL'];

export const defaultFeatures: FeaturesSelecta = {
  DEFAULT: true,
  ADVANCED: false,
  INTERNAL: false,
};

export interface FeatureContext {
  currentFeatures: FeatureLevel[];
  setFeature: (feature: FeatureLevel) => void;
  removeFeature: (feature: FeatureLevel) => void;
}

export const featuresCTX = React.createContext<FeatureContext>({
  currentFeatures: [],
  setFeature: () => {},
  removeFeature: () => {},
});

export function isFeatureEnabled(
  currentFeatures: FeatureLevel[],
  feature: FeatureLevel,
) {
  return currentFeatures.includes(feature);
}

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
export function FeatureToggler({ className, style }: ClassStyleId) {
  const { currentFeatures, setFeature, removeFeature } = React.useContext(
    featuresCTX,
  );

  const selectFeature = React.useCallback(
    (feature: FeatureLevel) => {
      if (isFeatureEnabled(currentFeatures, feature)) {
        removeFeature(feature);
      } else {
        setFeature(feature);
      }
    },
    [currentFeatures, setFeature, removeFeature],
  );

  return React.useMemo(
    () => (
      <DropMenu
        label={'Features'}
        items={availableFeatures.map(feature => ({
          value: feature,
          label: (
            <>
              <input
                type="checkbox"
                defaultChecked={isFeatureEnabled(currentFeatures, feature)}
                onChange={() => selectFeature(feature)}
                onClick={e => e.stopPropagation()}
              />
              {feature}
            </>
          ),
        }))}
        onSelect={({ value: feature }) => selectFeature(feature)}
        containerClassName={className}
        style={style}
      />
    ),
    [currentFeatures, selectFeature, className, style],
  );
}
