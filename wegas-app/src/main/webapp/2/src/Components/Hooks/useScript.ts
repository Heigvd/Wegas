import * as React from 'react';
import { instantiate } from '../../data/scriptable';
import { Player, VariableDescriptor as VDSelect } from '../../data/selectors';
import { useStore, store } from '../../data/store';
import { featuresCTX, isFeatureEnabled } from '../Contexts/FeaturesProvider';
import { languagesCTX } from '../Contexts/LanguagesProvider';
import { useGameModel } from './useGameModel';
import { Actions } from '../../data';
import { transpile } from 'typescript';
import { classesCTX } from '../Contexts/ClassesProvider';
import { deepDifferent } from './storeHookFactory';
import {
  IVariableDescriptor,
  WegasClassNames,
  SGameModel,
  SPlayer,
  STranslatableContent,
  SStringDescriptor,
  STextDescriptor,
  SStaticTextDescriptor,
  IScript,
  SVariableDescriptor,
  SVariableInstance,
} from 'wegas-ts-api';
import { ScriptableEntity } from 'wegas-ts-api';
import { popupDispatch, addPopup, PopupActionCreator } from '../PopupManager';
import { ActionCreator } from '../../data/actions';
import { translate } from '../../Editor/Components/FormView/translatable';
import { wwarn } from '../../Helper/wegaslog';
import { getItems } from '../../data/methods/VariableDescriptorMethods';
import { replace } from '../../Helper/tools';

interface GlobalVariableClass {
  find: <T extends IVariableDescriptor>(
    _gm: unknown,
    name: string,
  ) => ScriptableEntity<T> | undefined;
  select: <T extends SVariableDescriptor>(
    _gm: unknown,
    id: number,
  ) => T | undefined;
  getItems: <T = SVariableDescriptor<SVariableInstance>>(
    itemsIds: number[],
  ) => Readonly<T[]>;
}

interface GlobalClasses {
  gameModel?: Readonly<SGameModel>;
  self?: Readonly<SPlayer>;
  Variable: GlobalVariableClass;
  Editor: GlobalEditorClass;
  ClientMethods: GlobalClientMethodClass;
  ServerMethods: GlobalServerMethodClass;
  Schemas: GlobalSchemaClass;
  Classes: GlobalClassesClass;
  Popups: GlobalPopupClass;
  WegasEvents: WegasEventClass;
  I18n: GlobalI18nClass;
  Context: {
    [name: string]: unknown;
  };
}

const globalDispatch = store.dispatch;

export function createSandbox<T = unknown>() {
  const sandbox = document.createElement('iframe');
  // This is used to prevent unwanted modification from scripts.
  // One can still access main window from the sandbox (window.top) and modify it from there. (Break it)
  sandbox.setAttribute('sandbox', 'allow-same-origin');
  sandbox.style.display = 'none';
  document.body.appendChild(sandbox);
  return { sandbox, globals: (sandbox.contentWindow as unknown) as T };
}

const { sandbox, globals } = createSandbox<GlobalClasses>();

export function useGlobals() {
  // Hooks
  const player = useStore(Player.selectCurrent);
  const splayer = instantiate(player);
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
  globals.gameModel = instantiate(gameModel);
  globals.self = instantiate(player);

  // Variable class
  globals.Variable = {
    find: <T extends IVariableDescriptor>(_gm: unknown, name: string) => {
      const iDesc = VDSelect.findByName<T>(name);
      if (iDesc) {
        return instantiate(iDesc) as ScriptableEntity<T> | undefined;
      }
    },
    select: <T extends SVariableDescriptor>(_gm: unknown, id: number) => {
      const iDesc = VDSelect.select<IVariableDescriptor>(id);
      if (iDesc) {
        return instantiate(iDesc) as unknown as T | undefined;
      }
    },
    getItems,
  };

  // Editor class
  globals.Editor = {
    getFeatures: () =>
      Object.keys(defaultFeatures).reduce(
        (fs, f: FeatureLevel) => ({
          ...fs,
          [f]: isFeatureEnabled(currentFeatures, f),
        }),
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

  /**
   * Add a custom client method that can be used in client scripts
   * @param name - the name of the method
   * @param parameters - the parameters of the method. (! always use "[[...],... as const")
   * @param types - the returned types of the method
   * @param array - the method will return a signle object or an array of objects
   * @param method - the method to add
   */
  const addMethod: ClientMethodAdd = (
    name,
    parameters,
    types,
    array,
    method,
  ) => {
    if (
      name != null &&
      parameters != null &&
      types != null &&
      parameters != null &&
      array != null &&
      parameters != null &&
      method != null
    ) {
      globalDispatch(
        Actions.EditorActions.setClientMethod(
          name,
          parameters,
          types,
          array as keyof ArrayedTypeMap,
          method,
        ),
      );
    }
  };

  // ClientMethods class
  globals.ClientMethods = {
    addMethod: addMethod,
    getMethod: (name: string) => {
      return store.getState().global.clientMethods[name]
        .method as () => WegasScriptEditorReturnType;
    },
  };

  const registerMethod: ServerMethodRegister = (objects, method, schema) => {
    globalDispatch(
      Actions.EditorActions.registerServerMethod(objects, method, {
        ...schema,
        '@class': 'GlobalServerMethod',
      }),
    );
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
      globalDispatch(
        Actions.EditorActions.setSchema(name, schemaFN, simpleFilter),
      );
    },
    removeSchema: (name: string) => {
      globalDispatch(Actions.EditorActions.setSchema(name));
    },
  };

  // Classes class
  const { addClass, removeClass } = React.useContext(classesCTX);
  globals.Classes = {
    addClass,
    removeClass,
  };

  globals.Popups = {
    addPopup: (id, message, duration) => {
      if (id != null && message != null) {
        popupDispatch(addPopup(id, message, duration));
      }
    },
    removePopup: id => popupDispatch(PopupActionCreator.REMOVE_POPUP({ id })),
  };

  globals.WegasEvents = {
    addEventHandler: (id, type, cb) => {
      if (id != null && type != null && cb != null) {
        if (store.getState().global.eventsHandlers[type][id] == null) {
          globalDispatch(
            ActionCreator.EDITOR_ADD_EVENT_HANDLER({
              id,
              type,
              cb: (cb as unknown) as WegasEventHandler,
            }),
          );
        }
      }
    },
    removeEventHandler: (id, type) => {
      if (id != null && type != null) {
        7;
        if (store.getState().global.eventsHandlers[type][id] != null) {
          globalDispatch(
            ActionCreator.EDITOR_REMOVE_EVENT_HANDLER({ id, type }),
          );
        }
      }
    },
  };

  globals.I18n = {
    translate: translatable => {
      return translate(translatable, lang);
    },
    toString: entity => {
      let translatableEntity: STranslatableContent | undefined;
      switch (entity.getEntity()['@class']) {
        case 'StringDescriptor': {
          translatableEntity = (entity as SStringDescriptor)
            .getInstance(splayer)
            .getTrValue();
          break;
        }
        case 'TextDescriptor': {
          translatableEntity = (entity as STextDescriptor)
            .getInstance(splayer)
            .getTrValue();
          break;
        }
        case 'StaticTextDescriptor': {
          translatableEntity = (entity as SStaticTextDescriptor).getText();
          break;
        }
        default: {
          translatableEntity = entity.getLabel();
          break;
        }
      }
      return translate(translatableEntity, lang);
    },
  };
}

export type ReturnType = object | number | boolean | string | undefined;

export function clientScriptEval<T extends ReturnType>(
  script?: string | IScript,
  context?: {
    [name: string]: unknown;
  }
): T extends IMergeable ? unknown : T {
  globals.Context = context || {};
  const scriptContent = typeof script === 'string' ? script : script?.content;
  return scriptContent != null
    ? (((sandbox.contentWindow as unknown) as {
      eval: (code: string) => T;
    })
      // 'undefined' so that an empty script don't return '"use strict"'
      .eval('"use strict";undefined;' + transpile(scriptContent)) as any)
    : undefined;
}

export function safeClientScriptEval<T extends ReturnType>(
  script?: string | IScript,
  context?: {
    [name: string]: unknown;
  },
  catchCB?: (e: Error) => void,
): T extends IMergeable ? unknown : T {
  try {
    return clientScriptEval<T>(script, context);
  } catch (e) {
    const scriptContent = typeof script === 'string' ? script : script?.content;
    wwarn(
      `Script error at line ${e.lineNumber} : ${e.message
      }\n\nScript content is :\n${scriptContent}\n\nTranspiled content is :\n${scriptContent != null ? transpile(scriptContent) : undefined
      }`,
    );
    catchCB && catchCB(e);
    return undefined as any;
  }
}

/**
 * Hook, execute a script locally.
 * @param script code to execute
 * @returns Last expression or undefined in case it errors.
 */
export function useScript<T extends ReturnType>(
  script?: string | IScript,
  context?: {
    [name: string]: unknown;
  },
  catchCB?: (e: Error) => void,
): (T extends WegasScriptEditorReturnType ? T : unknown) | undefined {
  useGlobals();
  // useScriptContext();
  const fn = React.useCallback(() => safeClientScriptEval<T>(script, context, catchCB), [
    script,
    context,
    catchCB,
  ]);
  return useStore(fn, deepDifferent) as any;
}

/**
 * Hook, execute a script locally.
 * @param script code to execute
 * @returns Last expression or LocalEvalError in case it errors.
 */
export function useUnsafeScript<T extends ReturnType>(
  script?: string | IScript,
  context?: {
    [name: string]: unknown;
  },
): T extends IMergeable ? unknown : T {
  useGlobals();

  const fn = React.useCallback(() => clientScriptEval<T>(script, context), [script, context]);
  return useStore(fn, deepDifferent) as any;
}


export function parseAndRunClientScript(
  script: string | IScript,
  context?: {
    [name: string]: unknown;
  },
) {
  let scriptContent = 'string' === typeof script ? script : script.content;

  /*
  const test1 = runClientScript("JKJKJ")
  const test2 = runClientScript(const salut = 2;)
  const test3 = runClientScript(ohmama())
   */

  const regexStart = /(runClientScript\(["|'|`])/g;
  const regexEnd = /(["|'|`]\))/g;
  const simpleVarFindRegex = new RegExp(
    regexStart.source + `.*` + regexEnd.source,
  );
  let matched;
  let index = 0;


  do {
    matched = scriptContent.substr(index).match(simpleVarFindRegex);
    if (matched) {
      index += (matched.index == null ? scriptContent.length : matched.index);
      const matchedCode = matched[0].replace(regexStart, "").slice(0, -2);
      const matchedValue = String(safeClientScriptEval<string>(matchedCode, context));

      scriptContent = replace(scriptContent, index, matched[0].length + 1, matchedValue);

      index += matchedValue.length;
    }
  }
  while (matched)


  return 'string' === typeof script ? scriptContent : { ...script, content: scriptContent };
}

export function serverScriptEval() {

}