import { useCallback } from 'react';
import { proxyfy } from '../../data/proxyfy';
import { Player, VariableDescriptor as VDSelect } from '../../data/selectors';
import { useStore, store } from '../../data/store';
import { featuresCTX } from '../FeatureProvider';
import * as React from 'react';
import {
  GlobalEditorClass,
  FeaturesSelecta,
  FeatureLevel,
} from './types/scriptEditorGlobals';
import { LangContext } from '../LangContext';
import { useGameModel } from './useGameModel';
import {
  GlobalMethodClass,
  GlobalMethodReturnTypesName,
  WegasScriptEditorReturnType,
  GlobalMethodReturn,
  WegasScriptEditorReturnTypeName,
} from './types/scriptMethodGlobals';
import { Actions } from '../../data';
import { GlobalSchemaClass, CustomSchemaFN } from './types/scriptSchemaGlobals';
import * as ts from 'typescript';

interface GlobalVariableClass {
  find: <T extends IVariableDescriptor>(
    _gm: unknown,
    name: string,
  ) => Readonly<Readonly<T>> | undefined;
}
interface GlobalClasses {
  gameModel?: Readonly<Readonly<IGameModel>>;
  self?: Readonly<Readonly<IPlayer>>;
  typeFactory: <T extends WegasScriptEditorReturnTypeName>(
    types: T[],
  ) => GlobalMethodReturnTypesName;
  Variable: GlobalVariableClass;
  Editor: GlobalEditorClass;
  Methods: GlobalMethodClass;
  Schemas: GlobalSchemaClass;
}

const sandbox = document.createElement('iframe');
// This is used to prevent unwanted modification from scripts.
// One can still access main window from the sandbox (window.top) and modify it from there. (Break it)
sandbox.setAttribute('sandbox', 'allow-same-origin');
sandbox.style.display = 'none';
document.body.appendChild(sandbox);
const globals = (sandbox.contentWindow as unknown) as GlobalClasses;

export function useGlobals() {
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
  globals.typeFactory = (types: WegasScriptEditorReturnTypeName[]) =>
    Object.values(types).reduce((o, t) => ({ ...o, [t]: true }), {});

  const test = globals.typeFactory(['ISAaiAccount', 'number']);

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

  // Methods class
  globals.Methods = {
    addMethod: <T extends GlobalMethodReturnTypesName>(
      name: string,
      returnType: T,
      method: () => GlobalMethodReturn<T>,
    ) => {
      store.dispatch(Actions.EditorActions.setMethod(name, returnType, method));
    },
    getMethod: (name: string) =>
      store.getState().global.methods[name]
        .method as () => WegasScriptEditorReturnType,
  };

  // Schemas class
  globals.Schemas = {
    addSchema: (
      name: string,
      schemaFN: CustomSchemaFN,
      simpleFilter?: WegasClassNames,
    ) => {
      store.dispatch(
        Actions.EditorActions.setSchema(name, schemaFN, simpleFilter),
      );
    },
    removeSchema: (name: string) => {
      store.dispatch(Actions.EditorActions.setSchema(name));
    },
  };
}

export function scriptEval<ReturnValue>(script: string) {
  return (
    ((sandbox.contentWindow as unknown) as {
      eval: (code: string) => ReturnValue;
    })
      // 'undefined' so that an empty script don't return '"use strict"'
      .eval('"use strict";undefined;' + script)
  );
}

/**
 * Hook, execute a script locally.
 * @param script code to execute
 * @returns Last expression or LocalEvalError in case it errors.
 */
export function useScript<ReturnValue>(script: string) {
  useGlobals();
  const fn = useCallback(
    () => scriptEval<ReturnValue>(ts.transpile(script)), // 'undefined' so that an empty script don't return '"use strict"'
    [script],
  );
  return useStore(fn);
}
