import { cloneDeep, escapeRegExp, isEqual, uniq } from 'lodash-es';
import * as React from 'react';
import { transpile } from 'typescript';
import {
  IScript,
  IVariableDescriptor,
  ScriptableEntity,
  SStaticTextDescriptor,
  SStringDescriptor,
  STextDescriptor,
  STranslatableContent,
  SVariableDescriptor,
  WegasClassNames,
} from 'wegas-ts-api';
import { APIScriptMethods } from '../../API/clientScriptHelper';
import { downloadFile, fileURL } from '../../API/files.api';
import { Actions } from '../../data';
import { ActionCreator } from '../../data/actions';
import { entityIs } from '../../data/entities';
import {
  createTranslatableContent,
  createTranslation,
  translate,
} from '../../data/i18n';
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
import { insertReturn } from '../../Editor/Components/ScriptEditors/TempScriptEditor';
import { registerEffect, useRef } from '../../Helper/pageEffectsManager';
import { createLRU, replace, visitDSF } from '../../Helper/tools';
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
} from '../PageComponents/tools/schemaProps';
import { addPopup } from '../PopupManager';
import { deepDifferent } from './storeHookFactory';

import { globals } from './sandbox';

import { polygon, lineString, multiPolygon, multiLineString, feature } from '@turf/helpers';
import * as lineIntersect from '@turf/line-intersect';
import * as bboxClip from '@turf/bbox-clip';

import * as GeoJSON from 'ol/format/GeoJSON';
import * as VectorSource from 'ol/source/Vector';
import { transformExtent } from 'ol/proj';
import { initializeProjection } from '../Maps/helpers/proj4js';



function downloadDataAsFile(filename: string, data: string) {
  // create a fake anchor element
  const pom: HTMLAnchorElement = document.createElement('a');
  // insert textual data in href attribute
  pom.setAttribute(
    'href',
    'data:text/plain;charset=utf-8,' + encodeURIComponent(data),
  );
  pom.setAttribute('download', filename);
  pom.click();
}

const globalDispatch = store.dispatch;

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
    escapeRegExp: escapeRegExp,
    useRef,
    getState: getPageState,
    getLogger: getLogger,
    registerEffect: registerEffect,
    getFilePath: fileURL,
    downloadFile: downloadFile,
    downloadDataAsFile,
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

  globals.Turf = {
    lineIntersect: lineIntersect.default,
    lineString: lineString,
    multiLineString: multiLineString,
    polygon: polygon,
    multiPolygon: multiPolygon,
    feature : feature,
    bboxClip: bboxClip.default
  }

  globals.OpenLayer = {
    format :{
      GeoJSON : GeoJSON.default,
    },
    source : {
      VectorSource : VectorSource.default
    },
    transformExtent : transformExtentWrapper
  }

}

function transformExtentWrapper(ext: ExtentLikeObject, srcProj: string, destProj: string, opt_stops: number | undefined ): ExtentLikeObject {

  initializeProjection(srcProj);
  initializeProjection(destProj);
  return transformExtent(ext, srcProj, destProj, opt_stops) as ExtentLikeObject;
}

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
  extraArgs: string[] = [],
) {
  // transpile first
  const jsScript = transpile(script);

  // script does not containes any return statement (eval-style returns last-evaluated statement)
  // such a statement must be added
  const fnBody = injectReturn ? insertReturn(jsScript) : jsScript;
  //
  const fnScript =
    'eval = () => {throw new Error("Eval is evil");};return (function(){"use strict";undefined;' +
    fnBody +
    '})();';

  // hide forbidden object by overriding them with parameters
  // on call, provide undefined arguments
  return new globals.Function(
    'Function',
    'globalThis',
    'window',
    'top',
    '__WegasModules',
    'exports',
    ...extraArgs,
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

  return <T>(
    script?: string | IScript | ScriptCallback,
    context: PageComponentContext = {},
    state?: PagesContextState,
    options?: TranspileOptions,
    argValues: unknown[] = [],
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
          transpileToFunction(
            script.content,
            options,
            isScriptCallback(script) ? script.args : undefined,
          )!,
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
        globals.__WegasCurrentModule = options.moduleName
      }
      if (WEGAS_SAFE_MODE) {
        wlog('Drop script exec !');
        return undefined as any;
      }
      // do not provide effective arguments ever !
      const v = scriptAsFunction(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        exports,
        ...argValues,
      );
      // clear current module
      globals.__WegasCurrentModule = undefined
      return v;
    } else {
      return undefined as any;
    }
  };
})();

export function clientScriptEval<T>(
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

export function safeClientScriptEval<T>(
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
export function useScript<T>(
  script?: (string | IScript | undefined) | (string | IScript | undefined)[],
  context?: {
    [name: string]: unknown;
  },
  catchCB?: (e: Error) => void,
): T | undefined {
  const oldContext = React.useRef<{
    [name: string]: unknown;
  }>();

  const isFirstRun = React.useRef(true);

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

  React.useEffect(() => {
    isFirstRun.current = true;
  }, [fn]);

  const returnValue = useStore(s => {
    //ref +state.reloading
    setGlobals(globalContexts, s);

    const returnValue = fn();
    if (isFirstRun.current) {
      visitDSF(returnValue, item => {
        if (
          entityIs(item, 'VariableDescriptor', true) ||
          entityIs(item, 'VariableInstance', true)
        ) {
          return false;
        } else {
          if (typeof item === 'function') {
            throw Error(
              'You should never return a function from a useScript because function type variables are not comparable. To do that, use the useScriptCallback hook',
            );
          }
          return true;
        }
      });
    }

    return fn();
  }, deepDifferent);

  return returnValue as any;
}

/**
 * Hook, execute a script locally.
 * @param script code to execute
 * @returns Last expression or LocalEvalError in case it errors.
 */
export function useUnsafeScript<T>(
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

export type ContextRef = React.MutableRefObject<UnknownValuesObject | undefined>;

export function useUpdatedContextRef(context: UnknownValuesObject | undefined) {
  const contextRef = React.useRef(context);
  React.useEffect(() => {
    contextRef.current = context;
  });
  return contextRef;
}

export interface ScriptCallback {
  readonly '@class': 'ScriptCallback';
  content: string;
  args: string[];
}

export function iScriptArgsToCallbackArgs(
  args: [string, string[]][] = [],
): string[] {
  return args.map(([name]) => name);
}

export function createScriptCallback(
  content: string = '',
  args: string[] = [],
): ScriptCallback {
  return { '@class': 'ScriptCallback', content, args };
}

export function isScriptCallback(script: unknown): script is ScriptCallback {
  return (
    script != null &&
    typeof script === 'object' &&
    '@class' in script &&
    (script as { '@class': string })['@class'] === 'ScriptCallback'
  );
}

export function safeScriptCallbackEval<T>(
  script: ScriptCallback | undefined,
  context:
    | {
        [name: string]: unknown;
      }
    | undefined,
  catchCB: ((e: Error) => void) | undefined,
  state: PagesContextState | undefined,
  options: TranspileOptions | undefined,
  argValues: unknown[] = [],
): T extends WegasScriptEditorReturnType ? T : unknown {
  try {
    return memoClientScriptEval<T>(script, context, state, options, argValues);
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

export function useScriptObjectWithFallback<
  T extends Record<string, unknown>,
  ReturnType = { [P in keyof T]: Exclude<T[P], IScript | ScriptCallback> },
>(scriptObject: T, contextRef: ContextRef): ReturnType {
  const returnedObjectRef = React.useRef<ReturnType>();
  const scripts = Object.entries(scriptObject).filter(([, v]) =>
    entityIs(v, 'Script'),
  );
  const scriptKeys = scripts.map(([k]) => k);
  const scriptValues = scripts.map(([, v]) => v as IScript);
  const evaluatedScripts =
    useScript<ValueOf<T>[]>(scriptValues, contextRef.current) || [];
  const evaluatedScriptsObject = scriptKeys.reduce((o, k, i) => {
    o[k as string] = evaluatedScripts[i];
    return o;
  }, {} as Record<string, unknown>) as ReturnType;

  const callbacks = Object.entries(scriptObject).filter(([, v]) =>
    isScriptCallback(v),
  );

  const callbackKeys = callbacks.map(([k]) => k);
  const callbackValues = callbacks.map(([, v]) => v as ScriptCallback);
  const evaluatedCallbacks =
    useScriptCallbacks(callbackValues, contextRef) || [];
  const evaluatedCallbacksObject = callbackKeys.reduce((o, k, i) => {
    o[k as string] = evaluatedCallbacks[i];
    return o;
  }, {} as Record<string, unknown>) as ReturnType;

  const values = Object.entries(scriptObject)
    .filter(([, v]) => !entityIs(v, 'Script'))
    .filter(([, v]) => !isScriptCallback(v))
    .reduce((o, [k, v]) => {
      o[k as string] = v;
      return o;
    }, {} as Record<string, unknown>) as ReturnType;

  return React.useMemo(() => {
    const newObject = {
      ...values,
      ...evaluatedScriptsObject,
      ...evaluatedCallbacksObject,
    };
    if (
      returnedObjectRef.current != null &&
      isEqual(returnedObjectRef.current, newObject)
    ) {
      return returnedObjectRef.current;
    } else {
      returnedObjectRef.current = newObject;
      return newObject;
    }
  }, [evaluatedCallbacksObject, evaluatedScriptsObject, values]);
}

type AnyFunction = (...args: unknown[]) => unknown;

export function computeCB<T extends AnyFunction>(
  callbackScript: ScriptCallback,
  contextRef: ContextRef | undefined,
): T {
  return function (...cbArgs: Parameters<T>) {
    return safeScriptCallbackEval(
      callbackScript,
      contextRef?.current,
      undefined,
      pagesContextStateStore.getState(),
      {
        injectReturn: true,
      },
      cbArgs,
    );
  } as T;
}

const emptyCallback = createScriptCallback('', []);

export function useScriptCallback<T extends AnyFunction>(
  callbackScript: ScriptCallback = emptyCallback,
  contextRef: ContextRef,
) {
  const lastScript = React.useRef<unknown>();
  const lastReturn = React.useRef<T>();

  return React.useMemo(() => {
    if (!isEqual(callbackScript, lastScript.current)) {
      lastScript.current = callbackScript;
      const newReturn = computeCB<T>(callbackScript, contextRef);
      lastReturn.current = newReturn;
    }
    return lastReturn.current;
  }, [callbackScript, contextRef]);
}

function useScriptCallbacks(
  scriptCallbacks: ScriptCallback[],
  contextRef: ContextRef,
): AnyFunction[] {
  const lastScripts = React.useRef<ScriptCallback[]>();
  const lastReturns = React.useRef<((...args: unknown[]) => void)[]>([]);
  return React.useMemo(() => {
    if (!isEqual(scriptCallbacks, lastScripts.current)) {
      lastScripts.current = scriptCallbacks;
      const newReturns = scriptCallbacks.map(scriptCB =>
        computeCB(scriptCB, contextRef),
      );
      lastReturns.current = newReturns;
    }
    return lastReturns.current;
  }, [scriptCallbacks]);
}
