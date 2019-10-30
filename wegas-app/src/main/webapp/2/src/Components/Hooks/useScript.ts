import { useCallback } from 'react';
import { proxyfy } from '../../data/proxyfy';
import { Player, VariableDescriptor as VDSelect } from '../../data/selectors';
import { useStore } from '../../data/store';
import { featuresCTX } from '../FeatureProvider';
import * as React from 'react';
import {
  GlobalEditorClass,
  FeaturesSelecta,
  FeatureLevel,
} from './types/scriptEditorGlobals';
import { LangContext } from '../LangContext';
import { useGameModel } from './useGameModel';

interface GlobalVariableClass {
  find: <T extends IVariableDescriptor>(
    _gm: unknown,
    name: string,
  ) => Readonly<Readonly<T>> | undefined;
}
interface GlobalClasses {
  gameModel?: Readonly<Readonly<IGameModel>>;
  self?: Readonly<Readonly<IPlayer>>;
  Variable: GlobalVariableClass;
  Editor: GlobalEditorClass;
}

const sandbox = document.createElement('iframe');
// This is used to prevent unwanted modification from scripts.
// One can still access main window from the sandbox (window.top) and modify it from there. (Break it)
sandbox.setAttribute('sandbox', 'allow-same-origin');
sandbox.style.display = 'none';
document.body.appendChild(sandbox);
const globals = (sandbox.contentWindow as unknown) as GlobalClasses;

/**
 * Hook, execute a script locally.
 * @param script code to execute
 * @returns Last expression or LocalEvalError in case it errors.
 */
export function useScript<ReturnValue>(script: string) {
  // Hooks
  const player = useStore(Player.selectCurrent);
  const gameModel = useGameModel();
  const defaultFeatures: FeaturesSelecta = {
    DEFAULT: true,
    ADVANCED: false,
    INTERNAL: false,
  };
  const { currentFeatures, setFeature, removeFeature } = React.useContext(
    featuresCTX,
  );
  const { lang, selectLang } = React.useContext(LangContext);

  // Global variables
  globals.gameModel = proxyfy(gameModel);
  globals.self = proxyfy(player);

  // Variable class
  globals.Variable = {
    find: <T extends IVariableDescriptor>(_gm: unknown, name: string) =>
      proxyfy(VDSelect.findByName<T>(name)),
  };

  // Editor class
  globals.Editor = {
    getFeatures: () =>
      Object.keys(defaultFeatures).reduce(
        (fs, f: FeatureLevel) => ({ ...fs, [f]: currentFeatures.includes(f) }),
        defaultFeatures,
      ),
    setFeatures: (features: FeaturesSelecta) =>
      Object.keys(features).map((f: FeatureLevel) => {
        if (features[f]) {
          setFeature(f);
        } else {
          removeFeature(f);
        }
      }),
    getLanguage: () => gameModel.languages.find(l => l.code === lang),
    setLanguage: lang =>
      selectLang(typeof lang === 'string' ? lang : lang.code),
  };

  const fn = useCallback(
    () =>
      ((sandbox.contentWindow as unknown) as {
        eval: (code: string) => ReturnValue;
      }).eval('"use strict";undefined;' + script), // 'undefined' so that an empty script don't return '"use strict"'
    [script],
  );
  return useStore(fn);
}
