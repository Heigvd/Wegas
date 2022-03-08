import { useMonaco } from '@monaco-editor/react';
import u from 'immer';
import * as React from 'react';
import { IGameModelContent } from 'wegas-ts-api';
import { ILibraries, LibraryAPI } from '../../API/library.api';
import { useWebsocketEvent } from '../../API/websocket';
import { store } from '../../data/Stores/store';
import {
  MonacoEditor,
  SrcEditorLanguages,
} from '../../Editor/Components/ScriptEditors/editorHelpers';
import { getLogger, wlog } from '../../Helper/wegaslog';
import { useGlobalLibs } from '../Hooks/useGlobalLibs';
import {
  safeClientScriptEval,
  setGlobals,
  useGlobalContexts,
} from '../Hooks/useScript';

export function languageToFormat(language: SrcEditorLanguages | undefined) {
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
      'txt';
  }
}

let computedPathCounter = 1;

export function computePath(
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
  return { model, name };
}

export function useModel(
  modelContent: string,
  language: SrcEditorLanguages,
  modelName?: string,
) {
  const reactMonaco = useMonaco();
  React.useEffect(() => {
    // debugger;
    if (reactMonaco) {
      const newModel = createOrUpdateModel(
        reactMonaco,
        modelContent,
        language,
        modelName || name,
      );
      return () => newModel.model.dispose();
    }
  }, [language, modelContent, modelName, reactMonaco]);
}

interface LibraryWithPersisted {
  /**
   * persisted - the current state of the library in the server
   */
  persisted: IGameModelContent;
}

interface LibraryWithModified {
  /**
   * persisted - the current state of the library in the server
   */
  modified: IGameModelContent;
}

type LibraryWithStatus = Partial<LibraryWithPersisted> &
  Partial<LibraryWithModified>;

function doesPersistedExists(
  entry: [string, LibraryWithStatus] | [string, LibraryWithPersisted],
): entry is [string, LibraryWithPersisted] {
  return entry[1].persisted != null;
}

function doesLibraryExists(
  entry: [string, IGameModelContent | undefined] | [string, IGameModelContent],
): entry is [string, IGameModelContent] {
  return entry[1] != null;
}

interface LibrariesWithStatus {
  [id: string]: LibraryWithStatus;
}

/**
 * ILibrariesState is the state of every libraries of a certain type on the server
 */
interface LibrariesState {
  client: LibrariesWithStatus;
  server: LibrariesWithStatus;
  style: LibrariesWithStatus;
}

interface SetUpLibrariesStateAction {
  type: 'SetUpLibrariesState';
  /**
   * librariesType - the type of the libraries to add in state
   */
  librariesType: keyof LibrariesState;
  /**
   * libraries - the map of libraries of the new librariesState
   */
  libraries: ILibraries;
}

interface ModifyLibraryAction {
  type: 'ModifyLibrary';
  /**
   * libraryType - the type of the library to add in state
   */
  libraryType: keyof LibrariesState;
  /**
   * name - the name of the inserted library
   */
  name: string;
  /**
   * location - the location from where the modification is made
   */
  location: keyof LibraryWithStatus;
  /**
   * library - the library to be inserted
   */
  library: IGameModelContent;
}

interface RemoveLibraryAction {
  type: 'RemoveLibrary';
  /**
   * libraryType - the type of the library
   */
  libraryType: keyof LibrariesState;
  /**
   * location - the location from where the modification is made
   */
  location: keyof LibraryWithStatus;
  /**
   * name - the name of the inserted library
   */
  name: string;
}

type LibraryStateAction =
  | SetUpLibrariesStateAction
  | ModifyLibraryAction
  | RemoveLibraryAction;

/**
 * setLibraryState - the reducer for libraries management
 */
const setLibrariesState = (
  oldState: LibrariesState,
  action: LibraryStateAction,
) =>
  u(oldState, newState => {
    switch (action.type) {
      case 'SetUpLibrariesState': {
        const { librariesType, libraries } = action;
        newState[librariesType] = Object.entries(
          libraries,
        ).reduce<LibrariesWithStatus>(
          (o, [k, lib]) => ({
            ...o,
            [k]: {
              persisted: lib,
              modified:
                newState[librariesType] != null &&
                newState[librariesType][k] != null
                  ? newState[librariesType][k].modified
                  : undefined,
            },
          }),
          {},
        );
        break;
      }
      case 'ModifyLibrary': {
        const { libraryType, name, location, library } = action;
        if (newState[libraryType][name] == null) {
          newState[libraryType][name] = {
            persisted: undefined,
            modified: undefined,
          };
        }
        newState[libraryType][name][location] = library;
        break;
      }
      case 'RemoveLibrary': {
        const { libraryType, name, location } = action;
        if (newState[libraryType][name] != null) {
          newState[libraryType][name][location] = undefined;
        }
        break;
      }
    }
    return newState;
  });

interface LibrariesContext {
  librariesState: LibrariesState;
  modifyLibrary: (action: ModifyLibraryAction) => void;
  removeLibrary: (action: RemoveLibraryAction) => void;
}

const defaultLibrariesState: LibrariesState = {
  client: {},
  server: {},
  style: {},
};

export const librariesCTX = React.createContext<LibrariesContext>({
  librariesState: defaultLibrariesState,
  modifyLibrary: () => {},
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

  // Effect triggers on first rendering only
  React.useEffect(() => {
    LibraryAPI.getAllLibraries('ClientScript')
      .then((libraries: ILibraries) => {
        try {
          dispatchLibrariesState({
            type: 'SetUpLibrariesState',
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
          type: 'SetUpLibrariesState',
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
          type: 'SetUpLibrariesState',
          librariesType: 'style',
          libraries,
        });
      })
      .catch(() => {
        librariesLoaderLogger.warn('Cannot get style scripts');
      });

    // Run global contexts before loading external client scripts
    setGlobals(globalContexts, store.getState());
    CurrentGM.properties.clientScriptUri?.split(';').map(scriptUrl => {
      if (scriptUrl !== '') {
        fetch(scriptUrl)
          .then(res => {
            if (res.ok) {
              return res.text().then(text => ({ text, scriptUrl }));
            } else {
              throw Error(res.status + ' : ' + res.statusText);
            }
          })
          .then(res => {
            safeClientScriptEval(
              res.text,
              undefined,
              () =>
                librariesLoaderLogger.warn(
                  `In static client script : ${res.scriptUrl}`,
                ),
              undefined,
              {
                injectReturn: false,
                moduleName: scriptUrl,
              },
            );
          })
          .catch(e => {
            librariesLoaderLogger.warn(e);
          });
      }
    });
    // No trigger here in order to fill the library state only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clientScriptEventHandler = React.useCallback(
    (updatedLibraryName: string) => {
      LibraryAPI.getLibrary('ClientScript', updatedLibraryName).then(
        (library: IGameModelContent) => {
          dispatchLibrariesState({
            type: 'ModifyLibrary',
            libraryType: 'client',
            name: updatedLibraryName,
            location: 'persisted',
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
            type: 'ModifyLibrary',
            libraryType: 'server',
            name: updatedLibraryName,
            location: 'persisted',
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
            type: 'ModifyLibrary',
            libraryType: 'style',
            name: updatedLibraryName,
            location: 'persisted',
            library,
          });
        },
      );
    },
    [],
  );
  useWebsocketEvent('LibraryUpdate-CSS', styleScriptEventHandler);

  React.useEffect(() => {
    Object.entries(librariesState.client)
      .filter(doesPersistedExists)
      .forEach(([key, lib]) =>
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

  // make sure to have up-to-date models
  React.useEffect(() => {
    if (reactMonaco != null) {
      Object.entries(librariesState).forEach(([libType, libTypes]) => {
        Object.entries(libTypes).forEach(([libName, libStatuses]) => {
          const extension =
            libType === 'client' ? 'ts' : libType === 'server' ? 'js' : 'css';
          const language: SrcEditorLanguages =
            libType === 'client'
              ? 'typescript'
              : libType === 'server'
              ? 'javascript'
              : 'css';

          Object.entries(libStatuses)
            .filter(doesLibraryExists)
            .forEach(([libStatus, library]) => {
              if (library?.content) {
                createOrUpdateModel(
                  reactMonaco,
                  library?.content,
                  language,
                  `file:///${libName}.${libStatus}.${extension}`,
                );
              }
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
      {Object.entries(librariesState.style)
        .filter(doesPersistedExists)
        .map(([key, lib]) => (
          <style className="WegasStyle" key={key}>
            {lib.persisted.content}
          </style>
        ))}
      <librariesCTX.Provider
        value={{
          librariesState,
          modifyLibrary: dispatchLibrariesState,
          removeLibrary: dispatchLibrariesState,
        }}
      >
        {props.children}
      </librariesCTX.Provider>
    </>
  );
}
