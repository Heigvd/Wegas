import { useMonaco } from '@monaco-editor/react';
import u from 'immer';
import { debounce } from 'lodash-es';
import * as React from 'react';
import { IGameModelContent } from 'wegas-ts-api';
import { ILibraries, LibraryAPI } from '../../API/library.api';
import { useWebsocketEvent } from '../../API/websocket';
import { store } from '../../data/Stores/store';
import {
  MonacoEditor,
  MonacoEditorModel,
  SrcEditorLanguages,
} from '../../Editor/Components/ScriptEditors/editorHelpers';
import { useJSONSchema } from '../../Editor/Components/ScriptEditors/useJSONSchema';
import { getLogger, wlog } from '../../Helper/wegaslog';
import { useGlobalLibs } from '../Hooks/useGlobalLibs';
import {
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

function computeLibraryPath(libName: string, libType: LibraryType) {
  return `file:///${libName}.${libraryTypeToFormat(libType)}`;
}

export function useComputePath(
  fileName: string | undefined,
  language: SrcEditorLanguages | undefined,
) {
  return React.useMemo(
    () => computePath(fileName, language),
    [fileName, language],
  );
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

interface LibraryWithStatus {
  /**
   * persisted - the current state of the library in the server
   */
  persisted: IGameModelContent;
  modified: boolean;
  conflict: boolean;
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
   * name - the name of the inserted library
   */
  name: string;
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
   * name - the name of the inserted library
   */
  name: string;
  /**
   * library - the library to be inserted
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
   * name - the name of the inserted library
   */
  name: string;
}

interface ModifyLibraryModelAction {
  actionType: 'ModifyLibraryModel';
  /**
   * libraryType - the type of the library
   */
  libraryType: LibraryType;
  /**
   * name - the name of the modified library
   */
  name: string;
  /**
   * modelValue - the value of the modified library's model
   */
  modelValue: string;
}

type LibraryStateAction =
  | SetUpLibrariesStateAction
  | SaveLibraryAction
  | UpdateLibrary
  | RemoveLibraryAction
  | ModifyLibraryModelAction;

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
            },
          }),
          {},
        );
        break;
      }
      case 'SaveLibrary':
      case 'UpdateLibrary': {
        const { libraryType, name, library } = action;
        if (newState[libraryType][name] == null) {
          newState[libraryType][name] = {
            persisted: library,
            modified: false,
            conflict: false,
          };
        }
        newState[libraryType][name].persisted = library;
        // If the library is saved by the user no more conflicts or modifications can exists
        if (action.actionType === 'SaveLibrary') {
          newState[libraryType][name].modified = false;
          newState[libraryType][name].conflict = false;
        }
        // If the library is updated by the server and the user is allready modifying it, there is a conflict
        else {
          if (newState[libraryType][name].modified) {
            newState[libraryType][name].conflict = true;
          }
        }
        break;
      }
      case 'RemoveLibrary': {
        const { libraryType, name } = action;
        if (newState[libraryType][name] != null) {
          delete newState[libraryType][name];
        }
        break;
      }
      case 'ModifyLibraryModel': {
        const { libraryType, name, modelValue } = action;
        newState[libraryType][name].modified =
          newState[libraryType][name].persisted.content !== modelValue;
        break;
      }
    }
    return newState;
  });

interface LibrariesContext {
  librariesState: LibrariesState;
  saveLibrary: (
    type: LibraryType,
    name: string,
    library: IGameModelContent,
  ) => void;
  removeLibrary: (libraryType: LibraryType, libraryName: string) => void;
}

const defaultLibrariesState: LibrariesState = {
  client: {},
  server: {},
  style: {},
};

export const librariesCTX = React.createContext<LibrariesContext>({
  librariesState: defaultLibrariesState,
  saveLibrary: () => {},
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
  const globalLibs = useGlobalLibs('Client');
  const jsonSchema = useJSONSchema();

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
            name: updatedLibraryName,
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
            name: updatedLibraryName,
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
            name: updatedLibraryName,
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
    let mounted = true;
    if (reactMonaco != null) {
      Object.entries(librariesState)
        .filter(isRealLibraryStateEntry)
        .forEach(([libraryType, libTypes]) => {
          Object.entries(libTypes)
            // Only update libraries that are not beeing modified
            .filter(([, libStatus]) => !libStatus.modified)
            .forEach(([name, libStatus]) => {
              const model = createOrUpdateModel(
                reactMonaco,
                libStatus.persisted.content,
                libraryTypeToLanguage(libraryType),
                computeLibraryPath(name, libraryType),
              );
              model.onDidChangeContent(() => {
                debounce(() => {
                  if (mounted) {
                    dispatchLibrariesState({
                      actionType: 'ModifyLibraryModel',
                      libraryType,
                      name,
                      modelValue: model.getValue(),
                    });
                  }
                }, 500)();
              });
            });
        });
    }
    return () => {
      mounted = false;
    };
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

  const saveLibrary = React.useCallback<LibrariesContext['saveLibrary']>(
    (libraryType, name, library) => {
      dispatchLibrariesState({
        actionType: 'SaveLibrary',
        libraryType,
        name,
        library,
      });
    },
    [],
  );

  const removeLibrary = React.useCallback<LibrariesContext['removeLibrary']>(
    (libraryType, name) => {
      // Remove library in state
      dispatchLibrariesState({
        actionType: 'RemoveLibrary',
        libraryType,
        name,
      });

      // Dispose library in monaco editor
      getModel(reactMonaco, computeLibraryPath(name, libraryType))?.dispose();
    },
    [reactMonaco],
  );

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
          saveLibrary,
          removeLibrary,
        }}
      >
        {props.children}
      </librariesCTX.Provider>
    </>
  );
}
