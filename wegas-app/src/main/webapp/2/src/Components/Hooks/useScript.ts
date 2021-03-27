import * as React from 'react';
import { instantiate } from '../../data/scriptable';
import { VariableDescriptor as VDSelect } from '../../data/selectors';
import { useStore, store } from '../../data/Stores/store';
import {
  defaultFeatures,
  FeatureContext,
  featuresCTX,
  isFeatureEnabled,
} from '../Contexts/FeaturesProvider';
import { LanguagesContext, languagesCTX } from '../Contexts/LanguagesProvider';
import { Actions } from '../../data';
import { transpile } from 'typescript';
import { ClassesContext, classesCTX } from '../Contexts/ClassesProvider';
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
import {
  createTranslatableContent,
  createTranslation,
  translate,
} from '../../Editor/Components/FormView/translatable';
import { wlog, wwarn } from '../../Helper/wegaslog';
import { getItems } from '../../data/methods/VariableDescriptorMethods';
import { replace, createLRU } from '../../Helper/tools';
import { APIScriptMethods } from '../../API/clientScriptHelper';
import { createScript, isScript } from '../../Helper/wegasEntites';
import { cloneDeep } from 'lodash-es';
import { State } from '../../data/Reducer/reducers';
import { formatScriptToFunctionBody } from '../../Editor/Components/ScriptEditors/WegasScriptEditor';
import {
  pagesContextStateStore,
  setPagesContextState,
  usePagesContextStateStore,
} from '../../data/Stores/pageContextStore';
import { PageComponentContext } from '../PageComponents/tools/options';

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
  Function: typeof globalThis['Function'];
  gameModel?: Readonly<SGameModel>;
  self?: Readonly<SPlayer>;
  API_VIEW: View;
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
  APIMethods: APIMethodsClass;
  Helpers: GlobalHelpersClass;
  wlog: (a: any) => void;
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

export const { sandbox, globals } = createSandbox<GlobalClasses>();

type GlobalContexts = FeatureContext & LanguagesContext & ClassesContext;

export function useGlobalContexts(): GlobalContexts {
  const featuresContext = React.useContext(featuresCTX);
  const languagesContext = React.useContext(languagesCTX);
  const classesContext = React.useContext(classesCTX);
  return { ...featuresContext, ...languagesContext, ...classesContext };
}

export function setGlobals(globalContexts: GlobalContexts, store: State) {
  const {
    lang,
    selectLang,
    currentFeatures,
    setFeature,
    removeFeature,
    addClass,
    removeClass,
  } = globalContexts;

  const player = store.players[store.global.currentPlayerId];
  const gameModel = store.gameModels[store.global.currentGameModelId];
  const pageLoaders = store.global.pageLoaders;

  const splayer = instantiate(player);

  // Global variables
  globals.gameModel = instantiate(gameModel);
  globals.self = instantiate(player);
  globals.API_VIEW = API_VIEW;
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
        return (instantiate(iDesc) as unknown) as T | undefined;
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
    getPageLoaders: () =>
      Object.entries(pageLoaders).reduce(
        (o, [name, script]) => ({
          ...o,
          [name]: Number(safeClientScriptEval(script)),
        }),
        {},
      ),
    setPageLoader: (name, pageId) =>
      globalDispatch(
        ActionCreator.EDITOR_REGISTER_PAGE_LOADER({
          name,
          pageId: createScript(JSON.stringify(pageId)),
        }),
      ),
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
      return store.global.clientMethods[name]
        .method as () => WegasScriptEditorReturnType;
    },
  };

  const registerGlobalMethod: ServerGlobalMethodRegister = (
    objects,
    method,
    schema,
  ) => {
    globalDispatch(
      Actions.EditorActions.registerServerMethod(objects, method, {
        ...schema,
        '@class': 'ServerGlobalMethod',
      }),
    );
  };

  const registerVariableMethod: ServerVariableMethodRegister = (
    variableClass,
    label,
    parameter,
    returns,
    serverCode,
  ) => {
    globalDispatch(
      Actions.EditorActions.registerVariableMethod(
        variableClass,
        label,
        parameter,
        returns,
        serverCode,
      ),
    );
  };

  // ServerMethods class
  globals.ServerMethods = {
    registerGlobalMethod,
    registerVariableMethod,
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
        if (store.global.eventsHandlers[type][id] == null) {
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
        if (store.global.eventsHandlers[type][id] != null) {
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
      let translatableEntity: STranslatableContent | undefined | null;
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
    createTranslatableContent: value => {
      return createTranslatableContent(lang, value);
    },
    createTranslation: value => {
      return createTranslation(lang, value);
    },
    currentLanguageCode: lang,
  };

  globals.APIMethods = APIScriptMethods;

  globals.Helpers = {
    cloneDeep: cloneDeep,
  };

  globals.wlog = wlog;
}

export type ScriptReturnType = object | number | boolean | string | undefined;

/**
 * Transpile to a new Function()
 */
function transpileToFunction(script: string) {
  // script does not containes any return statement (eval-style returns last-evaluated statement)
  // such a statement must be added
  // TODO: this function is not that robust... AST based transformation is required (quite a big job)
  const fnBody = formatScriptToFunctionBody(script);
  const fnScript = '"use strict"; undefined;' + transpile(fnBody);

  return new globals.Function(fnScript);
}

export function addSetterToState(state: PageComponentContext) {
  return Object.entries(state).reduce((o, [k, s]) => {
    if (typeof s === 'object' && s !== null && 'state' in s) {
      return {
        ...o,
        [k]: {
          ...s,
          setState: (newState: ((oldState: unknown) => unknown) | unknown) => {
            const newS =
              typeof newState === 'function'
                ? newState((s as { state: unknown }).state)
                : newState;
            setPagesContextState(k, newS);
          },
        },
      };
    } else {
      return {
        ...o,
        [k]: s,
      };
    }
  }, {});
}

const memoClientScriptEval = (() => {
  const transpiledCache = createLRU<string, Function>(500);

  return <T extends ScriptReturnType>(
    script?: string | IScript,
    context: PageComponentContext = {},
    state?: PageComponentContext,
  ): T extends IMergeable ? unknown : T => {
    const currentState = addSetterToState(
      state || pagesContextStateStore.getState(),
    );
    globals.Context = { ...currentState, ...context };

    let scriptAsFunction;
    if (!script) {
      return undefined as any;
    } else if (typeof script === 'string') {
      // scripts provided as string (eg. big clientscripts), are not cached
      scriptAsFunction = transpileToFunction(script);
    } else {
      if (!script.content) {
        return undefined as any;
      }

      if (!transpiledCache.has(script.content)) {
        // IScript not in cache -> transpile it
        transpiledCache.set(
          script.content,
          transpileToFunction(script.content)!,
        );
      }
      // fetch from cache
      scriptAsFunction = transpiledCache.get(script.content);
    }

    if (scriptAsFunction) {
      return scriptAsFunction();
    } else {
      return undefined as any;
    }
  };
})();

export function clientScriptEval<T extends ScriptReturnType>(
  script?: string | IScript,
  context?: {
    [name: string]: unknown;
  },
  state?: {
    [name: string]: unknown;
  },
): T extends IMergeable ? unknown : T {
  return memoClientScriptEval(script, context, state);
}

export function safeClientScriptEval<T extends ScriptReturnType>(
  script?: string | IScript,
  context?: {
    [name: string]: unknown;
  },
  catchCB?: (e: Error) => void,
  state?: {
    [name: string]: unknown;
  },
): T extends IMergeable ? unknown : T {
  try {
    return clientScriptEval<T>(script, context, state);
  } catch (e) {
    const scriptContent = typeof script === 'string' ? script : script?.content;
    wwarn(
      `Script error at line ${e.lineNumber} : ${
        e.message
      }\n\nScript content is :\n${scriptContent}\n\nTranspiled content is :\n${
        scriptContent != null ? transpile(scriptContent) : undefined
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
export function useScript<T extends ScriptReturnType>(
  script?: (string | IScript | undefined) | (string | IScript | undefined)[],
  context?: {
    [name: string]: unknown;
  },
  catchCB?: (e: Error) => void,
): (T extends WegasScriptEditorReturnType ? T : unknown) | undefined {
  const oldContext = React.useRef<{
    [name: string]: unknown;
  }>();

  const newContext = React.useMemo(() => {
    if (deepDifferent(context, oldContext.current)) {
      oldContext.current = context;
      return context;
    } else {
      return oldContext.current;
    }
  }, [context]);

  const globalContexts = useGlobalContexts();

  const state = usePagesContextStateStore(s => s);

  const fn = React.useCallback(() => {
    if (Array.isArray(script)) {
      return script.map(scriptItem =>
        safeClientScriptEval<T>(scriptItem, newContext, catchCB, state),
      );
    } else {
      return safeClientScriptEval<T>(script, newContext, catchCB, state);
    }
  }, [script, newContext, state, catchCB]);

  const returnValue = useStore(s => {
    setGlobals(globalContexts, s);
    return fn();
  }, deepDifferent);

  return returnValue as any;
}

/**
 * Hook, execute a script locally.
 * @param script code to execute
 * @returns Last expression or LocalEvalError in case it errors.
 */
export function useUnsafeScript<T extends ScriptReturnType>(
  script?: string | IScript,
  context?: {
    [name: string]: unknown;
  },
): T extends IMergeable ? unknown : T {
  const globalContexts = useGlobalContexts();

  const fn = React.useCallback(() => clientScriptEval<T>(script, context), [
    script,
    context,
  ]);
  const returnValue = useStore(s => {
    setGlobals(globalContexts, s);
    return fn();
  }, deepDifferent);

  return returnValue;
}

export function parseAndRunClientScript(
  script: string | IScript,
  context?: {
    [name: string]: unknown;
  },
) {
  let scriptContent = isScript(script) ? script.content : script;

  //const test1 = runClientScript("JKJKJ")
  //const test2 = runClientScript(const salut = 2;)
  //const test3 = runClientScript(ohmama())

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
      index += matched.index == null ? scriptContent.length : matched.index;
      const matchedCode = matched[0].replace(regexStart, '').slice(0, -2);
      let matchedValue = safeClientScriptEval<string>(matchedCode, context);

      if (typeof matchedValue === 'string') {
        matchedValue = `"${matchedValue}"`;
      }

      scriptContent = replace(
        scriptContent,
        index,
        matched[0].length + 1,
        matchedValue,
      );

      index += matchedValue?.length || 0;
    }
  } while (matched);

  return isScript(script)
    ? { ...script, content: scriptContent }
    : scriptContent;
}
