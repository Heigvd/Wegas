import { cloneDeep, uniq } from 'lodash-es';
import * as React from 'react';
import { transpile } from 'typescript';
import {
  IGame,
  IScript,
  IVariableDescriptor,
  ScriptableEntity,
  SGameModel,
  SPlayer,
  SStaticTextDescriptor,
  SStringDescriptor,
  STextDescriptor,
  STranslatableContent,
  SVariableDescriptor,
  SVariableInstance,
  WegasClassNames,
} from 'wegas-ts-api';
import { APIScriptMethods } from '../../API/clientScriptHelper';
import { fileURL } from '../../API/files.api';
import { Actions } from '../../data';
import { ActionCreator } from '../../data/actions';
import { getItems } from '../../data/methods/VariableDescriptorMethods';
import { DEFAULT_ROLES } from '../../data/Reducer/globalState';
import { State } from '../../data/Reducer/reducers';
import { instantiate } from '../../data/scriptable';
import { VariableDescriptor as VDSelect } from '../../data/selectors';
import {
  getPageState,
  PagesContextState,
  pagesContextStateStore,
  setPagesContextState,
  usePagesContextStateStore,
} from '../../data/Stores/pageContextStore';
import { store, useStore } from '../../data/Stores/store';
import {
  createTranslatableContent,
  createTranslation,
  translate,
} from '../../Editor/Components/FormView/translatable';
import { insertReturn } from '../../Editor/Components/ScriptEditors/TempScriptEditor';
import { registerEffect } from '../../Helper/pageEffectsManager';
import { createLRU, replace } from '../../Helper/tools';
import { createScript, isScript } from '../../Helper/wegasEntites';
import { getLogger, wlog, wwarn } from '../../Helper/wegaslog';
import { ClassesContext, classesCTX } from '../Contexts/ClassesProvider';
import {
  defaultFeatures,
  FeatureContext,
  featuresCTX,
  isFeatureEnabled,
} from '../Contexts/FeaturesProvider';
import { LanguagesContext, languagesCTX } from '../Contexts/LanguagesProvider';
import { PageComponentContext } from '../PageComponents/tools/options';
import {
  schemaProps,
  SchemaPropsType,
} from '../PageComponents/tools/schemaProps';
import { addPopup } from '../PopupManager';
import { deepDifferent } from './storeHookFactory';

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
  Error: typeof globalThis['Error'];
  Function: typeof globalThis['Function'];
  gameModel?: Readonly<SGameModel>;
  teams?: Readonly<Readonly<STeam>[]>;
  self?: Readonly<SPlayer>;
  schemaProps: SchemaPropsType;
  CurrentGame: IGame;
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
  Roles: RolesMehtods;
  wlog: (...args: unknown[]) => void;
  __WegasModules: {
    [moduleName: string]: {
      [exported: string]: unknown;
    };
  };
}

const globalDispatch = store.dispatch;

export function createSandbox<T = unknown>() {
  const sandbox = document.createElement('iframe');
  // This is used to prevent unwanted modification from scripts.
  // One can still access main window from the sandbox
  // (window.top) and modify it from there.
  // to prevent such access, window, globalThis and top are hidden
  // by function parameters (see transpileToFunction function)
  sandbox.setAttribute('sandbox', 'allow-same-origin');
  sandbox.style.display = 'none';
  document.body.appendChild(sandbox);

  if (sandbox.contentWindow != null) {
    const w = sandbox.contentWindow as any;
    // global object to to store esModule
    // will be hidden just like window, top and globalThis are
    w.__WegasModules = {};

    // to load esModule
    w.require = (moduleName: string) => {
      // get or create module
      let mod = w.__WegasModules[moduleName];
      if (mod == null) {
        mod = {};
        w.__WegasModules[moduleName] = mod;
      }
      // always return a proxy to
      //  1) allow importing before exporting
      //  2) prevent modifications
      return new Proxy(mod, { get: (m, key) => m[key] });
    };

    // Prevent http request by hiding fetch and XHR
    w.fetch = undefined;
    w.XMLHttpRequest = undefined;
    if (w.document != null) {
      // prevent creating new element
      // mainly to prenvent creating new iframe
      // (a way to get a brand new unrestricted window object)
      const doc = sandbox.contentWindow.document as any;
      doc.createElement = undefined;
      doc.createElementNS = undefined;
    }
  }
  return { sandbox, globals: sandbox.contentWindow as unknown as T };
}

export const { sandbox, globals } = createSandbox<GlobalClasses>();

type GlobalContexts = FeatureContext & LanguagesContext & ClassesContext;

export function useGlobalContexts(): GlobalContexts {
  const featuresContext = React.useContext(featuresCTX);
  const languagesContext = React.useContext(languagesCTX);
  const classesContext = React.useContext(classesCTX);

  return { ...featuresContext, ...languagesContext, ...classesContext };

  //
  //  return React.useMemo(() => {
  //    return { ...featuresContext, ...languagesContext, ...classesContext };
  //  }, [featuresContext, languagesContext, classesContext]);
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
  const teams = Object.values(store.teams);
  const pageLoaders = store.global.pageLoaders;

  const splayer = instantiate(player);

  // Global variables
  globals.gameModel = instantiate(gameModel);
  globals.teams = instantiate(teams);

  globals.self = instantiate(player);
  globals.schemaProps = schemaProps;
  globals.API_VIEW = API_VIEW;
  globals.CurrentGame = CurrentGame;
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
    getPageLoaders: () =>
      Object.entries(pageLoaders).reduce(
        (o, [name, script]) => ({
          ...o,
          [name]: Number(
            safeClientScriptEval(
              script,
              undefined,
              undefined,
              undefined,
              undefined,
            ),
          ),
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
        globalDispatch(addPopup(id, message, duration));
      }
    },
    removePopup: id => globalDispatch(ActionCreator.REMOVE_POPUP({ id })),
  };

  globals.WegasEvents = {
    addEventHandler: (id, type, cb) => {
      if (id != null && type != null && cb != null) {
        if (store.global.eventsHandlers[type][id] == null) {
          globalDispatch(
            ActionCreator.EDITOR_ADD_EVENT_HANDLER({
              id,
              type,
              cb: cb as unknown as WegasEventHandler,
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
    uniq: uniq,
    getState: getPageState,
    getLogger: getLogger,
    registerEffect: registerEffect,
    getFilePath: fileURL,
  };

  globals.Roles = {
    setRoles: (roles, defaultRoleId, rolesId) => {
      globalDispatch(
        ActionCreator.EDITOR_SET_ROLES({
          roles: { ...roles, ...DEFAULT_ROLES },
          defaultRoleId: defaultRoleId as string,
          rolesId,
        }),
      );
    },
  };

  globals.wlog = wlog;
}

export type ScriptReturnType = object | number | boolean | string | undefined;

interface TranspileOptions {
  moduleName?: string;
  injectReturn?: boolean;
}
/**
 * Transpile to a new Function()
 */
function transpileToFunction(
  script: string,
  { injectReturn = true }: TranspileOptions = {},
) {
  // transpile first
  const jsScript = transpile(script);

  // script does not containes any return statement (eval-style returns last-evaluated statement)
  // such a statement must be added
  // TODO: this function is not that robust... AST based transformation is required (quite a big job)
  const fnBody = injectReturn ? insertReturn(jsScript) : jsScript;
  const fnScript = '"use strict"; undefined;' + fnBody;

  // hide forbidden object by overriding them with parameters
  // on call, provide undefined arguments
  return new globals.Function(
    'globalThis',
    'window',
    'top',
    '__WegasModules',
    'exports',
    fnScript,
  );
}

export function addSetterToState(state: PagesContextState) {
  return Object.entries(state.context).reduce((o, [k, s]) => {
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
  // We dont know what kinf of function is inserted in LRU so we admit it's unknown function
  // eslint-disable-next-line @typescript-eslint/ban-types
  const transpiledCache = createLRU<string, Function>(500);

  return <T extends ScriptReturnType>(
    script?: string | IScript,
    context: PageComponentContext = {},
    state?: PagesContextState,
    options?: TranspileOptions,
  ): T extends WegasScriptEditorReturnType ? T : unknown => {
    const currentState = addSetterToState(
      state || pagesContextStateStore.getState(),
    );
    globals.Context = { ...currentState, ...context };

    let scriptAsFunction;
    if (!script) {
      return undefined as any;
    } else if (typeof script === 'string') {
      // scripts provided as string (eg. big clientscripts), are not cached
      scriptAsFunction = transpileToFunction(script, options);
    } else {
      if (!script.content) {
        return undefined as any;
      }

      if (!transpiledCache.has(script.content)) {
        // IScript not in cache -> transpile it
        transpiledCache.set(
          script.content,
          transpileToFunction(script.content, options)!,
        );
      }
      // fetch from cache
      scriptAsFunction = transpiledCache.get(script.content);
    }

    if (scriptAsFunction) {
      let exports = {};
      if (options?.moduleName) {
        // script with module name -> export symbol to internal WegasModules store
        exports = globals.__WegasModules[options?.moduleName];
        if (exports == null) {
          // modules not yet defined: create it
          exports = {};
          // and add it to modules store
          globals.__WegasModules[options?.moduleName] = exports;
        }
      }
      // do not provide effective arguments ever !
      return scriptAsFunction(
        undefined,
        undefined,
        undefined,
        undefined,
        exports,
      );
    } else {
      return undefined as any;
    }
  };
})();

export function clientScriptEval<T extends ScriptReturnType>(
  script: string | IScript | undefined,
  context:
    | {
        [name: string]: unknown;
      }
    | undefined,
  state: PagesContextState | undefined,
  options: TranspileOptions | undefined,
): T extends WegasScriptEditorReturnType ? T : unknown {
  return memoClientScriptEval(script, context, state, options);
}

interface WegasScriptError extends Error {
  fileName?: string;
  lineNumber?: number;
  columnNumber?: number;
}

export function printWegasScriptError(error: WegasScriptError): string {
  return `Script error in transpiled ${error.fileName}:${error.lineNumber}:${error.columnNumber} : ${error.message}`;
}

function handleError(error: unknown, filename?: string): WegasScriptError {
  if (error instanceof Error || error instanceof globals.Error) {
    const e: WegasScriptError = {
      message: error.message,
      name: error.name,
      stack: error.stack,
      fileName: filename,
      lineNumber: (error as unknown as { lineNumber?: number }).lineNumber,
      columnNumber: (error as unknown as { columnNumber?: number })
        .columnNumber,
    };
    return e;
  } else {
    const e: WegasScriptError = {
      message: 'Unknown Error' + error,
      name: 'WegasScriptError',
      fileName: filename,
    };
    return e;
  }
}

export function safeClientScriptEval<T extends ScriptReturnType>(
  script: string | IScript | undefined,
  context:
    | {
        [name: string]: unknown;
      }
    | undefined,
  catchCB: ((e: Error) => void) | undefined,
  state: PagesContextState | undefined,
  options: TranspileOptions | undefined,
): T extends WegasScriptEditorReturnType ? T : unknown {
  try {
    return clientScriptEval<T>(script, context, state, options);
  } catch (e) {
    const error = handleError(e, options?.moduleName);
    if (catchCB) {
      catchCB(error);
    } else {
      const scriptContent =
        typeof script === 'string' ? script : script?.content;
      wwarn(
        `${printWegasScriptError(error)}
        \n\nScript content is :\n${scriptContent}\n\nTranspiled content is :\n${
          scriptContent != null ? transpile(scriptContent) : undefined
        }`,
      );
    }
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

  //  const toStr = (s: IScript | string | undefined) =>
  //    entityIs(s, 'Script') ? s.content : s || '';
  //
  //  const strScript = Array.isArray(script)
  //    ? script
  //    : toStr(script);

  const fn = React.useCallback(() => {
    if (Array.isArray(script)) {
      return script.map(scriptItem =>
        safeClientScriptEval<T>(
          scriptItem,
          newContext,
          catchCB,
          state,
          undefined,
        ),
      );
    } else {
      return safeClientScriptEval<T>(
        script,
        newContext,
        catchCB,
        state,
        undefined,
      );
    }
  }, [script, newContext, state, catchCB]);

  const returnValue = useStore(s => {
    //ref +state.reloading
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
): T extends WegasScriptEditorReturnType ? T : unknown {
  const globalContexts = useGlobalContexts();

  const fn = React.useCallback(
    () => clientScriptEval<T>(script, context, undefined, undefined),
    [script, context],
  );
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
      let matchedValue = safeClientScriptEval<string>(
        matchedCode,
        context,
        undefined,
        undefined,
        undefined,
      );

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
