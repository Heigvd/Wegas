import * as React from 'react';
import { commonTranslations } from '../../i18n/common/common';
import { useInternalTranslate } from '../../i18n/internalTranslator';
import { CheckBox } from '../Inputs/Boolean/CheckBox';

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

export function useFeatures() {
  const i18nValues = useInternalTranslate(commonTranslations);
  const { currentFeatures, setFeature, removeFeature } =
    React.useContext(featuresCTX);
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
  return {
    label: i18nValues.features,
    items: availableFeatures.map(feature => ({
      value: feature,
      label: (
        <div
          onClick={e => {
            e.stopPropagation();
            selectFeature(feature);
          }}
        >
           <CheckBox
              value={isFeatureEnabled(currentFeatures, feature)}
              onChange={() => selectFeature(feature)}
              label={feature}
              horizontal
          />
        </div>
      ),
      noCloseMenu: true,
    })),
  };
}
