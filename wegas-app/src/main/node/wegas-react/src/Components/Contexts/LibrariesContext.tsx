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
import { store } from '../../data/Stores/store';
import { MessageStringStyle } from '../../Editor/Components/MessageString';
import {
  MonacoEditor,
  MonacoEditorModel,
  SrcEditorLanguages,
} from '../../Editor/Components/ScriptEditors/editorHelpers';
import { useJSONSchema } from '../../Editor/Components/ScriptEditors/useJSONSchema';
import { getLogger, wlog } from '../../Helper/wegaslog';
import { editorTabsTranslations } from '../../i18n/editorTabs/editorTabs';
import { useInternalTranslate } from '../../i18n/internalTranslator';
import { useGlobalLibs } from '../Hooks/useGlobalLibs';
import {
  clientScriptEval,
  safeClientScriptEval,
  setGlobals,
  useGlobalContexts,
} from '../Hooks/useScript';

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
      return 'typescript';
    case 'server':
      return 'javascript';
    case 'style':
      return 'css';
  }
}

function libraryTypeToFormat(libraryType: LibraryType): string {
  return languageToFormat(libraryTypeToLanguage(libraryType));
}

export function libraryTypeToServerLibraryType(
  libraryType: LibraryType,
): ServerLibraryType {
  switch (libraryType) {
    case 'client':
      return 'ClientScript';
    case 'server':
      return 'ServerScript';
    case 'style':
      return 'CSS';
  }
}

function libraryTypeToMimeType(libraryType: LibraryType) {
  switch (libraryType) {
    case 'client':
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
    return `file:///_generated_${timestamp}_${currentCount}.${languageToFormat(
      language,
    )}`;
  }
}

export function computeLibraryPath(libName: string, libType: LibraryType) {
  return `file:///${libName}.${libraryTypeToFormat(libType)}`;
}

const monacoLogger = getLogger('monaco');

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
  modified: boolean;
  conflict: boolean;
  visibility: IVisibility | undefined;
}

interface LibrariesWithStatus {
  [id: string]: LibraryWithStatus;
}

const libraryTypes = ['client', 'server', 'style'] as const;
export type LibraryType = ValueOf<typeof libraryTypes>;

/**
 * ILibrariesState is the state of every libraries of a certain type on the server
 */
type LibrariesState = Record<LibraryType, LibrariesWithStatus>;

function isRealLibraryStateEntry(
  entry: [string, LibrariesWithStatus] | [LibraryType, LibrariesWithStatus],
): entry is [LibraryType, LibrariesWithStatus] {
  return libraryTypes.includes(entry[0] as LibraryType);
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
   * libraryName - the name of the inserted library
   */
  libraryName: string;
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
   * name - the name of the saved library
   */
  libraryName: string;
  /**
   * library - the library to be saved
   */
  library: IGameModelContent;
}

interface RemoveLibraryAction {
  actionType: 'RemoveLibrary';
  /**
   * libraryType - the type of the library
   */
  libraryType: LibraryType;
  /**
   * name - the name of the removed library
   */
  libraryName: string;
}

interface ModifyLibraryModelAction {
  actionType: 'ModifyLibraryModel';
  /**
   * libraryType - the type of the library
   */
  libraryType: LibraryType;
  /**
   * libraryName - the name of the modified library
   */
  libraryName: string;
  /**
   * modelValue - the value of the modified library's model
   */
  modelValue: string;
}

interface ModifyLibraryVisibilityAction {
  actionType: 'ModifyLibraryVisibility';
  /**
   * libraryType - the type of the library
   */
  libraryType: LibraryType;
  /**
   * name - the name of the modified library
   */
  libraryName: string;
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
    switch (action.actionType) {
      case 'SetUpLibrariesState': {
        const { librariesType, libraries } = action;
        newState[librariesType] = Object.entries(
          libraries,
        ).reduce<LibrariesWithStatus>(
          (o, [k, lib]) => ({
            ...o,
            [k]: {
              persisted: lib,
              modified: false,
              conflict: false,
              visibility: lib.visibility,
            },
          }),
          {},
        );
        break;
      }
      case 'SaveLibrary':
      case 'UpdateLibrary': {
        const { libraryType, libraryName, library } = action;
        if (newState[libraryType][libraryName] == null) {
          newState[libraryType][libraryName] = {
            persisted: library,
            modified: false,
            conflict: false,
            visibility: library.visibility,
          };
        }

        newState[libraryType][libraryName].persisted = library;
        newState[libraryType][libraryName].visibility = library.visibility;

        // If the library is saved by the user no more conflicts or modifications can exists
        if (action.actionType === 'SaveLibrary') {
          newState[libraryType][libraryName].modified = false;
          newState[libraryType][libraryName].conflict = false;
        }
        // If the library is updated by the server and the user is allready modifying it, there is a conflict
        else {
          if (newState[libraryType][libraryName].modified) {
            newState[libraryType][libraryName].conflict = true;
          }
        }
        break;
      }
      case 'RemoveLibrary': {
        const { libraryType, libraryName } = action;
        if (newState[libraryType][libraryName] != null) {
          delete newState[libraryType][libraryName];
        }
        break;
      }
      case 'ModifyLibraryModel': {
        const { libraryType, libraryName, modelValue } = action;
        newState[libraryType][libraryName].modified =
          newState[libraryType][libraryName].persisted.content !== modelValue;
        break;
      }
      case 'ModifyLibraryVisibility': {
        const { libraryType, libraryName, visibility } = action;
        newState[libraryType][libraryName].visibility = visibility;
        newState[libraryType][libraryName].modified =
          newState[libraryType][libraryName].persisted.visibility !==
          visibility;
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
    libraryType: LibraryType,
    libraryName: string,
    saveLibraryCB?: (message: LibrariesCallbackMessage) => void,
  ) => void;
  setLibraryVisibility: (
    libraryType: LibraryType,
    libraryName: string,
    visibility: IVisibility,
  ) => void;
  removeLibrary: (
    libraryType: LibraryType,
    libraryName: string,
    removeLibraryCB?: (message: LibrariesCallbackMessage) => void,
  ) => void;
}

const defaultLibrariesState: LibrariesState = {
  client: {},
  server: {},
  style: {},
};

export const librariesCTX = React.createContext<LibrariesContext>({
  librariesState: defaultLibrariesState,
  addLibrary: () => {},
  saveLibrary: () => {},
  setLibraryVisibility: () => {},
  removeLibrary: () => {},
});

const librariesLoaderLogger = getLogger('LibrariesLoader');

export function LibrariesLoader(props: React.PropsWithChildren<{}>) {
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

  const clientScriptEventHandler = React.useCallback(
    (updatedLibraryName: string) => {
      LibraryAPI.getLibrary('ClientScript', updatedLibraryName).then(
        (library: IGameModelContent) => {
          dispatchLibrariesState({
            actionType: 'UpdateLibrary',
            libraryType: 'client',
            libraryName: updatedLibraryName,
            library,
          });
        },
      );
    },
    [],
  );
  useWebsocketEvent('LibraryUpdate-ClientScript', clientScriptEventHandler);

  const serverScriptEventHandler = React.useCallback(
    (updatedLibraryName: string) => {
      LibraryAPI.getLibrary('ClientScript', updatedLibraryName).then(
        (library: IGameModelContent) => {
          dispatchLibrariesState({
            actionType: 'UpdateLibrary',
            libraryType: 'server',
            libraryName: updatedLibraryName,
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
          dispatchLibrariesState({
            actionType: 'UpdateLibrary',
            libraryType: 'style',
            libraryName: updatedLibraryName,
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

  React.useEffect(() => {
    Object.entries(librariesState.client).forEach(([key, lib]) =>
      safeClientScriptEval(
        lib.persisted.content,
        undefined,
        () => librariesLoaderLogger.warn(`In client script  : ${key}`),
        undefined,
        {
          moduleName: `./${key}`,
          injectReturn: false,
        },
      ),
    );
  }, [librariesState.client]);

  // Update monaco editor's models when libraryState update
  React.useEffect(() => {
    if (reactMonaco != null) {
      Object.entries(librariesState)
        .filter(isRealLibraryStateEntry)
        .forEach(([type, libTypes]) => {
          Object.entries(libTypes)
            // Only update libraries that are not beeing modified
            .filter(([, libStatus]) => !libStatus.modified)
            .forEach(([name, libStatus]) => {
              const model = createOrUpdateModel(
                reactMonaco,
                libStatus.persisted.content,
                libraryTypeToLanguage(type),
                computeLibraryPath(name, type),
              );
              model.onDidChangeContent(() => {
                const libraryType = type;
                const libraryName = name;
                const modelValue = model.getValue();
                dispatchLibrariesState({
                  actionType: 'ModifyLibraryModel',
                  libraryType,
                  libraryName,
                  modelValue,
                });
              });
            });
        });
    }
  }, [librariesState, reactMonaco]);

  // Insert global libs in models
  React.useEffect(() => {
    if (reactMonaco != null) {
      globalLibs.forEach(lib => {
        createOrUpdateModel(reactMonaco, lib.content, 'typescript', lib.name);
      });
    }
  }, [globalLibs, reactMonaco]);

  // Configure editor
  React.useEffect(() => {
    if (reactMonaco != null) {
      reactMonaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        allowNonTsExtensions: true,
        checkJs: true,
        // allowJs: forceJS,
        lib: ['es2019'],
        target: reactMonaco.languages.typescript.ScriptTarget.ESNext,
      });
      reactMonaco.languages.typescript.javascriptDefaults.setCompilerOptions({
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
      LibraryAPI.addLibrary(
        libraryTypeToServerLibraryType(libraryType),
        libraryTypeToMimeType(libraryType),
        libraryName,
        '',
        'PRIVATE',
      )
        .then((res: IGameModelContent) => {
          dispatchLibrariesState({
            actionType: 'UpdateLibrary',
            libraryType,
            libraryName,
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
      libraryType: LibraryType,
      libraryName: string,
      saveLibraryCB?: (message: LibrariesCallbackMessage) => void,
    ) => {
      const libraryPath = computeLibraryPath(libraryName, libraryType);

      const selectedPersistedLibrary = librariesState[libraryType][libraryName];

      const selectedMonacoModel =
        reactMonaco != null ? getModel(reactMonaco, libraryPath) : undefined;

      if (
        selectedPersistedLibrary != null &&
        selectedMonacoModel != null &&
        isEditAllowed(selectedPersistedLibrary)
      ) {
        const newLibrary = cloneDeep(selectedPersistedLibrary.persisted);
        newLibrary.content = selectedMonacoModel.getValue();
        newLibrary.visibility = selectedPersistedLibrary.visibility;

        LibraryAPI.saveLibrary(
          libraryTypeToServerLibraryType(libraryType),
          libraryName,
          newLibrary,
        )
          .then(library => {
            let savedWithErrors = false;
            if (libraryType === 'client') {
              try {
                setGlobals(globalContexts, store.getState());
                clientScriptEval(library.content, undefined, undefined, {
                  moduleName: libraryPath,
                  injectReturn: false,
                });
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
              libraryType,
              libraryName,
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
      globalContexts,
      i18nValues.scripts.libraryCannotSave,
      i18nValues.scripts.librarySavedErrors,
      i18nValues.scripts.scriptSaved,
      librariesState,
      reactMonaco,
    ],
  );

  const removeLibrary = React.useCallback<LibrariesContext['removeLibrary']>(
    (libraryType, libraryName, removeLibraryCB) => {
      LibraryAPI.deleteLibrary(
        libraryTypeToServerLibraryType(libraryType),
        libraryName,
      )
        .then(() => {
          // Remove library in state
          dispatchLibrariesState({
            actionType: 'RemoveLibrary',
            libraryType,
            libraryName,
          });
          // Dispose library in monaco editor
          getModel(
            reactMonaco,
            computeLibraryPath(libraryName, libraryType),
          )?.dispose();
        })
        .catch(() => {
          removeLibraryCB &&
            removeLibraryCB({
              type: 'error',
              message: i18nValues.scripts.libraryCannotDelete,
            });
        });
    },
    [i18nValues.scripts.libraryCannotDelete, reactMonaco],
  );

  const setLibraryVisibility = React.useCallback<
    LibrariesContext['setLibraryVisibility']
  >((libraryType, libraryName, visibility) => {
    dispatchLibrariesState({
      actionType: 'ModifyLibraryVisibility',
      libraryType,
      libraryName,
      visibility,
    });
  }, []);

  return (
    <>
      {CurrentGM.properties.cssUri?.split(';').map(cssUrl => (
        <link
          key={cssUrl}
          className="WegasStaticStyle"
          rel="stylesheet"
          type="text/css"
          href={cssUrl}
        />
      ))}
      {Object.entries(librariesState.style).map(([key, lib]) => (
        <style className="WegasStyle" key={key}>
          {lib.persisted.content}
        </style>
      ))}
      <librariesCTX.Provider
        value={{
          librariesState,
          addLibrary,
          saveLibrary,
          setLibraryVisibility,
          removeLibrary,
        }}
      >
        {props.children}
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
