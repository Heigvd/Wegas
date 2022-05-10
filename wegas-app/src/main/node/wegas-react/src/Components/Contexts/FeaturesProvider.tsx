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
  toggleFeature: (feature: FeatureLevel) => void;
}

export const featuresCTX = React.createContext<FeatureContext>({
  currentFeatures: [],
  setFeature: () => {},
  removeFeature: () => {},
  toggleFeature: () => {},
});

export function isFeatureEnabled(
  currentFeatures: FeatureLevel[],
  feature: FeatureLevel,
) {
  return currentFeatures.includes(feature);
}

function FeaturesContext({
  children,
}: React.PropsWithChildren<UknownValuesObject>) {
  const [features, setFeatures] = React.useState<FeatureLevel[]>(['DEFAULT']);

  const enableFeature = React.useCallback((feature: FeatureLevel) => {
    setFeatures(state => [...state, feature]);
  }, []);

  const removeFeature = React.useCallback((feature: FeatureLevel) => {
    setFeatures(state => state.filter(feat => feat != feature));
  }, []);

  const toggleFeature = React.useCallback((feature: FeatureLevel) => {
    setFeatures(state => {
      if (state.includes(feature)) {
        return state.filter(feat => feat !== feature);
      } else {
        return [...state, feature];
      }
    });
  }, []);

  const listener = React.useCallback(
    (event: KeyboardEvent) => {
      if (event.ctrlKey && event.code === 'Backquote') {
        toggleFeature(event.altKey ? 'INTERNAL' : 'ADVANCED');
      }
    },
    [toggleFeature],
  );

  React.useEffect(() => {
    window.addEventListener('keydown', listener);

    return () => {
      window.removeEventListener('keydown', listener);
    };
  }, [listener]);

  return (
    <featuresCTX.Provider
      value={{
        currentFeatures: features,
        setFeature: enableFeature,
        removeFeature: removeFeature,
        toggleFeature: toggleFeature,
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
  const { currentFeatures, toggleFeature } = React.useContext(featuresCTX);
  const selectFeature = React.useCallback(
    (feature: FeatureLevel) => {
      toggleFeature(feature);
    },
    [toggleFeature],
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
