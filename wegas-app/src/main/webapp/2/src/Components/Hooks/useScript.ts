import { useCallback } from 'react';
import { proxyfy } from '../../data/proxyfy';
import { Player, VariableDescriptor as VDSelect } from '../../data/selectors';
import { useStore, store } from '../../data/store';
import { featuresCTX } from '../Contexts/FeaturesProvider';
import * as React from 'react';
import { languagesCTX } from '../Contexts/LanguagesProvider';
import { useGameModel } from './useGameModel';
import { Actions } from '../../data';
import * as ts from 'typescript';
import { classesCTX } from '../Contexts/ClassesProvider';

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
  ClientMethods: GlobalClientMethodClass;
  ServerMethods: GlobalServerMethodClass;
  Schemas: GlobalSchemaClass;
  Classes: GlobalClassesClass;
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
  const { lang, selectLang } = React.useContext(languagesCTX);

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

  const addMethod: ClientMethodAdd = (name, types, array, method) => {
    store.dispatch(
      Actions.EditorActions.setClientMethod(
        name,
        types,
        array as keyof ArrayedTypeMap,
        method,
      ),
    );
  };

  // // Test for addMethod
  // addMethod(
  //   "Taddaaa",
  //   ["number","string[]"],
  //   "array",
  //   ()=>[
  //       // Respecting the type
  //       ["yeah"],
  //       1234,
  //       // No respecting the type
  //       true,
  //       "nooo",
  //       [6666]
  //   ]);

  // ClientMethods class
  globals.ClientMethods = {
    addMethod: addMethod,
    getMethod: (name: string) => {
      return store.getState().global.clientMethods[name]
        .method as () => WegasScriptEditorReturnType;
    },
  };

  const registerMethod: ServerMethodRegister = (method, schema) => {
    store.dispatch(Actions.EditorActions.registerServerMethod(method, schema));
  };

  // ServerMethods class
  globals.ServerMethods = {
    registerMethod,
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

  // Classes class
  const { addClass, removeClass } = React.useContext(classesCTX);
  globals.Classes = {
    addClass,
    removeClass,
  };
}

export function safeClientTSScriptEval<ReturnValue>(script: string) {
  try {
    return clientScriptEval<ReturnValue>(script);
  } catch (e) {
    return undefined;
  }
}

export function clientScriptEval<ReturnValue>(script: string) {
  return (
    ((sandbox.contentWindow as unknown) as {
      eval: (code: string) => ReturnValue;
    })
      // 'undefined' so that an empty script don't return '"use strict"'
      .eval('"use strict";undefined;' + ts.transpile(script))
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
    () => clientScriptEval<ReturnValue>(script), // 'undefined' so that an empty script don't return '"use strict"'
    [script],
  );
  return useStore(fn);
}
