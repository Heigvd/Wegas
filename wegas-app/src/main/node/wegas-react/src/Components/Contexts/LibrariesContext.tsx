import { useMonaco } from '@monaco-editor/react';
import u from 'immer';
import { cloneDeep } from 'lodash-es';
import * as React from 'react';
import { IGameModelContent } from 'wegas-ts-api';
import {
  ILibraries,
  LibraryAPI,
  NewLibErrors,
  ServerLibraryType,
} from '../../API/library.api';
import { useWebsocketEvent } from '../../API/websocket';
import { GameModel } from '../../data/selectors';
import { setReloadingStatus } from '../../data/Stores/pageContextStore';
import { store } from '../../data/Stores/store';
import { MessageStringStyle } from '../../Editor/Components/MessageString';
import {
  MonacoEditor,
  MonacoEditorModel,
  SrcEditorLanguages,
} from '../../Editor/Components/ScriptEditors/editorHelpers';
import { useJSONSchema } from '../../Editor/Components/ScriptEditors/useJSONSchema';
import { clearEffects, runEffects } from '../../Helper/pageEffectsManager';
import { getLogger, wlog } from '../../Helper/wegaslog';
import { editorTabsTranslations } from '../../i18n/editorTabs/editorTabs';
import { useInternalTranslate } from '../../i18n/internalTranslator';
import { useDeepMemo } from '../Hooks/useDeepMemo';
import { useGlobalLibs } from '../Hooks/useGlobalLibs';
import {
  printWegasScriptError,
  safeClientScriptEval,
  setGlobals,
  useGlobalContexts,
} from '../Hooks/useScript';

const monacoLogger = getLogger('monaco');
const contextLogger = getLogger('Libraries Context');

function languageToFormat(language: SrcEditorLanguages | undefined): string {
  switch (language) {
    case 'css':
      return 'css';
    case 'javascript':
      return 'js';
    case 'json':
      return 'json';
    case 'plaintext':
      return 'txt';
    case 'typescript':
      return 'ts';
    default:
      return 'txt';
  }
}

function libraryTypeToLanguage(libraryType: LibraryType): SrcEditorLanguages {
  switch (libraryType) {
    case 'client':
    case 'clientInternal':
      return 'typescript';
    case 'server':
      return 'javascript';
    case 'style':
      return 'css';
  }
}

export function libraryTypeToFormat(libraryType: LibraryType): string {
  return languageToFormat(libraryTypeToLanguage(libraryType));
}

export function libraryTypeToServerLibraryType(
  libraryType: LibraryType,
): ServerLibraryType | undefined {
  switch (libraryType) {
    case 'client':
      return 'ClientScript';
    case 'server':
      return 'ServerScript';
    case 'style':
      return 'CSS';
    case 'clientInternal':
      return undefined;
  }
}

function libraryTypeToMimeType(libraryType: LibraryType): string {
  switch (libraryType) {
    case 'client':
    case 'clientInternal':
      return 'application/typescript';
    case 'server':
      return 'application/javascript';
    case 'style':
      return 'text/css';
  }
}

let computedPathCounter = 1;

function computePath(
  fileName: string | undefined,
  language: SrcEditorLanguages | undefined,
) {
  if (fileName) {
    return fileName;
  } else {
    // get current value then inc global counter
    const currentCount = computedPathCounter++;
    const timestamp = new Date().getTime();
    return `file:///_generated_${ timestamp }_${ currentCount }.${ languageToFormat(
      language,
    ) }`;
  }
}

export function computeLibraryPath(libName: string, libType: LibraryType) {
  return `file:///${ libType }/${ libName }.${ libraryTypeToFormat(libType) }`;
}

export function getModel(reactMonaco: MonacoEditor | null, modelPath: string) {
  return reactMonaco != null
    ? reactMonaco.editor.getModel(reactMonaco.Uri.parse(modelPath))
    : null;
}

export function createOrUpdateModel(
  reactMonaco: MonacoEditor,
  modelContent: string,
  language: SrcEditorLanguages,
  modelName?: string,
  onCreateCB?: (model: MonacoEditorModel) => void,
) {
  const name = computePath(modelName, language);
  const libUri = reactMonaco.Uri.parse(name);
  let model = reactMonaco.editor.getModel(libUri);

  if (model != null) {
    monacoLogger.info('Updating model');
    const currentValue = model.getValue();
    if (currentValue !== modelContent) {
      model.setValue(modelContent);
    }
  } else {
    monacoLogger.info('Creating model');
    model = reactMonaco.editor.createModel(modelContent, language, libUri);
    model.setEOL(reactMonaco.editor.EndOfLineSequence.LF);
    onCreateCB && onCreateCB(model);
  }
  return model;
}

export function useTempModel(
  initialModelContent: string,
  language: SrcEditorLanguages,
) {
  const modelContent = React.useRef(initialModelContent);
  const reactMonaco = useMonaco();
  const [model, setModel] = React.useState<MonacoEditorModel | null>(null);

  React.useEffect(() => {
    const currentModel = reactMonaco
      ? createOrUpdateModel(reactMonaco, modelContent.current, language)
      : null;
    setModel(currentModel);
    return () => currentModel?.dispose();
  }, [language, reactMonaco]);

  return model;
}

export interface LibraryWithStatus {
  /**
   * persisted - the current state of the library in the server
   */
  persisted: IGameModelContent;
  monacoPath: string;
  label: string;
  libraryType: LibraryType;
  modified: boolean;
  conflict: boolean;
  readOnly: boolean;
  visibility: IVisibility | undefined;
}

interface LibrariesWithStatus {
  [path: string]: LibraryWithStatus;
}

const libraryTypes = ['client', 'server', 'style', 'clientInternal'] as const;
export type LibraryType = ValueOf<typeof libraryTypes>;

/**
 * ILibrariesState is the state of every libraries of a certain type on the server
 */
type LibrariesState = LibrariesWithStatus;

//function isRealLibraryStateEntry(
//  entry: [string, LibrariesWithStatus] | [LibraryType, LibrariesWithStatus],
//): entry is [LibraryType, LibrariesWithStatus] {
//  return libraryTypes.includes(entry[0] as LibraryType);
//}

export function filterByLibraryType(state: LibrariesState, libraryType: LibraryType): LibraryWithStatus[] {
  return Object.values(state)
    .filter(entry => entry.libraryType === libraryType);
}

interface SetUpLibrariesStateAction {
  actionType: 'SetUpLibrariesState';
  /**
   * librariesType - the type of the libraries to add in state
   */
  librariesType: LibraryType;
  /**
   * libraries - the map of libraries of the new librariesState
   */
  libraries: ILibraries;
}

interface UpdateLibrary {
  actionType: 'UpdateLibrary';
  /**
   * libraryType - the type of the library to add in state
   */
  libraryType: LibraryType;
  /**
   * libraryPath - the path of the inserted library
   */
  libraryPath: string;
  /**
   * library - the library to be inserted
   */
  library: IGameModelContent;
}

interface SaveLibraryAction {
  actionType: 'SaveLibrary';
  /**
   * libraryType - the type of the library to add in state
   */
  libraryType: LibraryType;
  /**
   * libraryPath - the path of the saved library
   */
  libraryPath: string;
  /**
   * library - the library to be saved
   */
  library: IGameModelContent;
}

interface RemoveLibraryAction {
  actionType: 'RemoveLibrary';
  /**
   * libraryPath - the path of the removed library
   */
  libraryPath: string;
}

interface ModifyLibraryModelAction {
  actionType: 'ModifyLibraryModel';
  /**
   * libraryPath - the path of the modified library
   */
  libraryPath: string;
  /**
   * modelValue - the value of the modified library's model
   */
  modelValue: string;
}

interface ModifyLibraryVisibilityAction {
  actionType: 'ModifyLibraryVisibility';
  /**
   * path - the path of the modified library
   */
  libraryPath: string;
  /**
   * modelValue - the value of the modified library's model
   */
  visibility: IVisibility;
}

type LibraryStateAction =
  | SetUpLibrariesStateAction
  | SaveLibraryAction
  | UpdateLibrary
  | RemoveLibraryAction
  | ModifyLibraryModelAction
  | ModifyLibraryVisibilityAction;

/**
 * setLibraryState - the reducer for libraries management
 */
const setLibrariesState = (
  oldState: LibrariesState,
  action: LibraryStateAction,
) =>
  u(oldState, newState => {
    contextLogger.info(action.actionType);
    switch (action.actionType) {
      case 'SetUpLibrariesState': {
        const { librariesType, libraries } = action;

        Object.values(libraries).forEach(gameModelContent => {
          const path = computeLibraryPath(gameModelContent.contentKey, librariesType);
          newState[path] = {
            persisted: gameModelContent,
            monacoPath: path,
            label: gameModelContent.contentKey,
            libraryType: librariesType,
            modified: false,
            conflict: false,
            readOnly: librariesType === 'clientInternal',
            visibility: gameModelContent.visibility,
          };
        });
        break;
      }
      case 'SaveLibrary':
      case 'UpdateLibrary': {
        const { libraryType, libraryPath, library } = action;

        if (newState[libraryPath] == null) {
          newState[libraryPath] = {
            persisted: library,
            libraryType: libraryType,
            label: library.contentKey,
            monacoPath: libraryPath,
            modified: false,
            conflict: false,
            readOnly: libraryType === 'clientInternal',
            visibility: library.visibility,
          };
        }

        newState[libraryPath].persisted = library;
        newState[libraryPath].visibility = library.visibility;

        // If the library is saved by the user no more conflicts or modifications can exists
        if (action.actionType === 'SaveLibrary') {
          newState[libraryPath].modified = false;
          newState[libraryPath].conflict = false;
        }
        // If the library is updated by the server and the user is allready modifying it, there is a conflict
        else {
          if (newState[libraryPath].modified) {
            newState[libraryPath].conflict = true;
          }
        }
        break;
      }
      case 'RemoveLibrary': {
        const { libraryPath } = action;
        if (newState[libraryPath] != null) {
          delete newState[libraryPath];
        }
        break;
      }
      case 'ModifyLibraryModel': {
        const { libraryPath, modelValue } = action;
        newState[libraryPath].modified =
          newState[libraryPath].persisted.content !== modelValue;
        break;
      }
      case 'ModifyLibraryVisibility': {
        const { libraryPath, visibility } = action;
        newState[libraryPath].visibility = visibility;
        newState[libraryPath].modified =
          newState[libraryPath].persisted.visibility !== visibility;
        break;
      }
    }
    return newState;
  });

export interface LibrariesCallbackMessage {
  type: MessageStringStyle;
  message: string;
}

interface LibrariesContext {
  librariesState: LibrariesState;
  addLibrary: (
    libraryType: LibraryType,
    libraryName: string,
    addLibraryCB?: (message: LibrariesCallbackMessage) => void,
  ) => void;
  saveLibrary: (
    libraryName: string,
    saveLibraryCB?: (message: LibrariesCallbackMessage) => void,
  ) => void;
  setLibraryVisibility: (
    libraryName: string,
    visibility: IVisibility,
  ) => void;
  removeLibrary: (
    libraryName: string,
    removeLibraryCB?: (message: LibrariesCallbackMessage) => void,
  ) => void;
}

const defaultLibrariesState: LibrariesState = {
};

export const librariesCTX = React.createContext<LibrariesContext>({
  librariesState: defaultLibrariesState,
  addLibrary: () => { },
  saveLibrary: () => { },
  setLibraryVisibility: () => { },
  removeLibrary: () => { },
});

const librariesLoaderLogger = getLogger('LibrariesLoader');

function executeClientLibrary(libraryName: string, libraryContent: string) {
  safeClientScriptEval(
    libraryContent,
    undefined,
    e => librariesLoaderLogger.warn(printWegasScriptError(e)),
    undefined,
    {
      moduleName: `./${ libraryName }`,
      injectReturn: false,
    },
  );
}

type ScriptEntry = [string, string];

/**
 *Execute all client script
 */
function execAllScripts(scripts: ScriptEntry[]) {
  // set PageStore reloading status to true to prevent usePagesContextStateStore  hooks to be triggered
  setReloadingStatus(true);
  clearEffects();

  scripts.forEach(([k, v]) => {
    executeClientLibrary(k, v);
  });

  runEffects();
  // resumes pagesStore status, hooks will be triggered
  setReloadingStatus(false);
}

export function LibrariesLoader(
  props: React.PropsWithChildren<UknownValuesObject>,
) {
  const [librariesState, dispatchLibrariesState] = React.useReducer(
    setLibrariesState,
    defaultLibrariesState,
  );
  const globalContexts = useGlobalContexts();
  const reactMonaco = useMonaco();
  const globalLibs = useGlobalLibs();
  const jsonSchema = useJSONSchema();
  const i18nValues = useInternalTranslate(editorTabsTranslations);

  // Effect triggers on first rendering only
  React.useEffect(() => {
    LibraryAPI.getAllLibraries('ClientScript')
      .then((libraries: ILibraries) => {
        try {
          dispatchLibrariesState({
            actionType: 'SetUpLibrariesState',
            librariesType: 'client',
            libraries,
          });
          execAllScripts(
            Object.entries(libraries).map(([k, v]) => {
              return [k, v.content];
            }),
          );
        } catch (e) {
          wlog(e);
        }
      })
      .catch(() => {
        librariesLoaderLogger.warn('Cannot get client scripts');
      });

    LibraryAPI.getAllLibraries('ServerScript')
      .then((libraries: ILibraries) => {
        dispatchLibrariesState({
          actionType: 'SetUpLibrariesState',
          librariesType: 'server',
          libraries,
        });
      })
      .catch(() => {
        librariesLoaderLogger.warn('Cannot get server scripts');
      });

    LibraryAPI.getAllLibraries('CSS')
      .then((libraries: ILibraries) => {
        dispatchLibrariesState({
          actionType: 'SetUpLibrariesState',
          librariesType: 'style',
          libraries,
        });
      })
      .catch(() => {
        librariesLoaderLogger.warn('Cannot get style scripts');
      });

    // TODO : fetch only from specific internal path
    //   CurrentGM.properties.clientScriptUri?.split(';').map(scriptUrl => {
    //     if (scriptUrl !== '') {
    //       fetch('./' + scriptUrl)
    //         .then(res => {
    //           if (res.ok) {
    //             return res.text().then(text => ({ text, scriptUrl }));
    //           } else {
    //             throw Error(res.status + ' : ' + res.statusText);
    //           }
    //         })
    //         .then(res => {
    //           safeClientScriptEval(
    //             res.text,
    //             undefined,
    //             () =>
    //               librariesLoaderLogger.warn(
    //                 `In static client script : ${res.scriptUrl}`,
    //               ),
    //             undefined,
    //             {
    //               injectReturn: false,
    //               moduleName: scriptUrl,
    //             },
    //           );
    //         })
    //         .catch(e => {
    //           librariesLoaderLogger.warn(e);
    //         });
    //     }
    //   });
    //   // No trigger here in order to fill the library state only once
    //   // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clientScripts =
    useDeepMemo(
      filterByLibraryType(librariesState, 'client')
        .reduce<Record<string, string>>((acc, gmc) => {
          acc[gmc.persisted.contentKey] = gmc.persisted.content;
          return acc;
        }, {}));

  const clientScriptEventHandler = React.useCallback(
    (updatedLibraryName: string) => {
      LibraryAPI.getLibrary('ClientScript', updatedLibraryName).then(
        (library: IGameModelContent) => {
          const path = computeLibraryPath(updatedLibraryName, "client");
          dispatchLibrariesState({
            actionType: 'UpdateLibrary',
            libraryType: 'client',
            libraryPath: path,
            library,
          });
          execAllScripts(Object.entries(clientScripts));
        },
      );
    },
    [clientScripts],
  );
  useWebsocketEvent('LibraryUpdate-ClientScript', clientScriptEventHandler);

  const serverScriptEventHandler = React.useCallback(
    (updatedLibraryName: string) => {
      LibraryAPI.getLibrary('ServerScript', updatedLibraryName).then(
        (library: IGameModelContent) => {
          const path = computeLibraryPath(updatedLibraryName, "server");
          dispatchLibrariesState({
            actionType: 'UpdateLibrary',
            libraryType: 'server',
            libraryPath: path,
            library,
          });
        },
      );
    },
    [],
  );
  useWebsocketEvent('LibraryUpdate-ServerScript', serverScriptEventHandler);

  const styleScriptEventHandler = React.useCallback(
    (updatedLibraryName: string) => {
      LibraryAPI.getLibrary('CSS', updatedLibraryName).then(
        (library: IGameModelContent) => {
          const path = computeLibraryPath(updatedLibraryName, "style");
          dispatchLibrariesState({
            actionType: 'UpdateLibrary',
            libraryType: 'style',
            libraryPath: path,
            library,
          });
        },
      );
    },
    [],
  );
  useWebsocketEvent('LibraryUpdate-CSS', styleScriptEventHandler);

  // Refreshing globals when global contexts changes should any global changes trigger a new script reevalutation???
  // Should the store state also be a trigger???
  React.useEffect(() => {
    setGlobals(globalContexts, store.getState());
  }, [globalContexts]);

  // React.useEffect(() => {
  //   Object.entries(librariesState.client).forEach(([key, lib]) =>
  //     safeClientScriptEval(
  //       lib.persisted.content,
  //       undefined,
  //       () => librariesLoaderLogger.warn(`In client script  : ${key}`),
  //       undefined,
  //       {
  //         moduleName: `./${key}`,
  //         injectReturn: false,
  //       },
  //     ),
  //   );
  // }, [librariesState.client]);

  // Update monaco editor's models when libraryState update
  React.useEffect(() => {
    if (reactMonaco != null) {
      Object.entries(librariesState)
        // Only update libraries that are not beeing modified
        .filter(([, libStatus]) => !libStatus.modified)
        .forEach(([path, libStatus]) => {
          createOrUpdateModel(
            reactMonaco,
            libStatus.persisted.content,
            libraryTypeToLanguage(libStatus.libraryType),
            path,
            model => {
              model.onDidChangeContent(() => {
                const modelValue = model.getValue();
                dispatchLibrariesState({
                  actionType: 'ModifyLibraryModel',
                  libraryPath: path,
                  modelValue,
                });
              });
            },
          );
        });
    }
  }, [librariesState, reactMonaco]);

  // Insert global libs in models
  React.useEffect(() => {
    if (reactMonaco != null) {
      const libs = globalLibs.reduce<ILibraries>((acc, current) => {

        acc[current.name] = {
          "@class": 'GameModelContent',
          contentKey: current.name,
          content: current.content,
          visibility: 'INTERNAL',
          version: 0,
          contentType: 'application/typescript',
        }
        return acc;
      }, {});

      dispatchLibrariesState({
        actionType: 'SetUpLibrariesState',
        librariesType: 'clientInternal',
        libraries: libs
      });
    }
  }, [globalLibs, reactMonaco]);

  // Configure editor
  React.useEffect(() => {
    if (reactMonaco != null) {
      reactMonaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        strict: true,
        allowNonTsExtensions: true,
        checkJs: true,
        // allowJs: forceJS,
        lib: ['es2019'],
        target: reactMonaco.languages.typescript.ScriptTarget.ESNext,
      });
      reactMonaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        strict: true,
        allowNonTsExtensions: true,
        checkJs: true,
        allowJs: true,
        lib: ['es5'],
        target: reactMonaco.languages.typescript.ScriptTarget.ES5,
      });
      reactMonaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        schemas: [
          {
            uri: 'internal://page-schema.json',
            fileMatch: ['page.json'],
            schema: jsonSchema,
          },
        ],
      });
    }
  }, [jsonSchema, reactMonaco]);

  const addLibrary = React.useCallback<LibrariesContext['addLibrary']>(
    (libraryType, libraryName, addLibrary) => {
      const effectiveType = libraryTypeToServerLibraryType(libraryType);
      if (effectiveType == null) {
        // if client-side type has no server-side equivalent, just do notting
        return;
      }
      LibraryAPI.addLibrary(
        effectiveType,
        libraryTypeToMimeType(libraryType),
        libraryName,
        '',
        'PRIVATE',
      )
        .then((res: IGameModelContent) => {
          const path = computeLibraryPath(libraryName, libraryType);
          dispatchLibrariesState({
            actionType: 'UpdateLibrary',
            libraryType,
            libraryPath: path,
            library: res,
          });
          addLibrary && addLibrary({ type: 'succes', message: libraryName });
        })
        .catch((e: NewLibErrors) => {
          switch (e) {
            case 'NOTNEW':
              addLibrary &&
                addLibrary({
                  type: 'error',
                  message: i18nValues.scripts.scriptNameNotAvailable,
                });
              break;
            case 'UNKNOWN':
            default:
              addLibrary &&
                addLibrary({
                  type: 'error',
                  message: i18nValues.scripts.cannotCreateScript,
                });
          }
        });
    },
    [
      i18nValues.scripts.cannotCreateScript,
      i18nValues.scripts.scriptNameNotAvailable,
    ],
  );

  const saveLibrary = React.useCallback<LibrariesContext['saveLibrary']>(
    (
      libraryPath: string,
      saveLibraryCB?: (message: LibrariesCallbackMessage) => void,
    ) => {

      const selectedPersistedLibrary = librariesState[libraryPath];

      const selectedMonacoModel =
        reactMonaco != null ? getModel(reactMonaco, libraryPath) : undefined;

      const effectiveType = libraryTypeToServerLibraryType(selectedPersistedLibrary.libraryType);
      if (effectiveType == null) {
        return;
      }

      if (
        selectedPersistedLibrary != null &&
        selectedMonacoModel != null &&
        isEditAllowed(selectedPersistedLibrary)
      ) {
        const newLibrary = cloneDeep(selectedPersistedLibrary.persisted);
        newLibrary.content = selectedMonacoModel.getValue();
        newLibrary.visibility = selectedPersistedLibrary.visibility;

        LibraryAPI.saveLibrary(
          effectiveType,
          selectedPersistedLibrary.persisted.contentKey,
          newLibrary,
        )
          .then(library => {
            let savedWithErrors = false;
            if (effectiveType === 'ClientScript') {
              try {
                // set PageStore reloading status to true to prevent usePagesContextStateStore hooks to be triggered
                // pageStore will be resumed after all clientscript libs will have been reloaded
                setReloadingStatus(true);
                // this execution is only made to catch errors
                executeClientLibrary(selectedPersistedLibrary.label, library.content);
              } catch (e) {
                savedWithErrors = true;
              }
            }
            if (savedWithErrors) {
              saveLibraryCB &&
                saveLibraryCB({
                  type: 'warning',
                  message: i18nValues.scripts.librarySavedErrors,
                });
            } else {
              saveLibraryCB &&
                saveLibraryCB({
                  type: 'succes',
                  message: i18nValues.scripts.scriptSaved,
                });
            }

            dispatchLibrariesState({
              actionType: 'SaveLibrary',
              libraryType: selectedPersistedLibrary.libraryType,
              libraryPath,
              library,
            });
          })
          .catch(() => {
            saveLibraryCB &&
              saveLibraryCB({
                type: 'error',
                message: i18nValues.scripts.libraryCannotSave,
              });
          });
      }
    },
    [
      i18nValues.scripts.libraryCannotSave,
      i18nValues.scripts.librarySavedErrors,
      i18nValues.scripts.scriptSaved,
      librariesState,
      reactMonaco,
    ],
  );

  const removeLibrary = React.useCallback<LibrariesContext['removeLibrary']>(
    (libraryPath, removeLibraryCB) => {

      const selectedPersistedLibrary = librariesState[libraryPath];
      const libraryType = selectedPersistedLibrary.libraryType;

      const effectiveType = libraryTypeToServerLibraryType(libraryType);
      if (effectiveType ==null){
        return;
      }

      LibraryAPI.deleteLibrary(
      effectiveType,
        selectedPersistedLibrary.persisted.contentKey,
      )
        .then(() => {
          // Remove library in state
          dispatchLibrariesState({
            actionType: 'RemoveLibrary',
            libraryPath,
          });
          // Dispose library in monaco editor
          getModel(reactMonaco, libraryPath)?.dispose();
        })
        .catch(() => {
          removeLibraryCB &&
            removeLibraryCB({
              type: 'error',
              message: i18nValues.scripts.libraryCannotDelete,
            });
        });
    },
    [i18nValues.scripts.libraryCannotDelete, reactMonaco, librariesState],
  );

  const setLibraryVisibility = React.useCallback<
    LibrariesContext['setLibraryVisibility']
  >((libraryPath, visibility) => {
    dispatchLibrariesState({
      actionType: 'ModifyLibraryVisibility',
      libraryPath,
      visibility,
    });
  }, []);

  const stylesheets = filterByLibraryType(librariesState, 'style');

  return (
    <>
      { CurrentGM.properties.cssUri?.split(';').map(cssUrl => (
        <link
          key={ cssUrl }
          className="WegasStaticStyle"
          rel="stylesheet"
          type="text/css"
          href={ cssUrl }
        />
      )) }
      { }
      { stylesheets.map(stylesheet => (
        <style className="WegasStyle" key={ stylesheet.persisted.contentKey }>
          { stylesheet.persisted.content }
        </style>
      )) }
      <librariesCTX.Provider
        value={ {
          librariesState,
          addLibrary,
          saveLibrary,
          setLibraryVisibility,
          removeLibrary,
        } }
      >
        { props.children }
      </librariesCTX.Provider>
    </>
  );
}

export function isEditAllowed(library?: LibraryWithStatus): boolean {
  return (
    GameModel.selectCurrent().type !== 'SCENARIO' ||
    library?.persisted.visibility === 'PRIVATE' ||
    library?.persisted.visibility === 'INHERITED'
  );
}

export type IVisibility = IAbstractContentDescriptor['visibility'];
export const visibilities: IVisibility[] = [
  'INTERNAL',
  'PROTECTED',
  'INHERITED',
  'PRIVATE',
];

/**
 * isVisibilityAllowed is a function that tells if a visibility can be sat to the current library
 * depending on the GameModel type and the current visibility of the library
 *
 * @param librariesState - the state of the script editor
 * @param visibility - the wanted new visibility
 */
export const isVisibilityAllowed = (
  library: LibraryWithStatus,
  visibility: IVisibility,
): boolean => {
  return (
    visibility === 'PRIVATE' ||
    visibility === library.persisted.visibility ||
    GameModel.selectCurrent().type === 'MODEL'
  );
};
