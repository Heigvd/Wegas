import { css, cx } from '@emotion/css';
import u from 'immer';
import { omit } from 'lodash-es';
import * as React from 'react';
import { IAbstractContentDescriptor, IGameModelContent } from 'wegas-ts-api';
import {
  ILibraries,
  LibraryAPI,
  LibType,
  NewLibErrors,
} from '../../../API/library.api';
import { useWebsocketEvent, WebSocketEvent } from '../../../API/websocket';
import {
  clientScriptEval,
  setGlobals,
  useGlobalContexts,
} from '../../../Components/Hooks/useScript';
import { Button } from '../../../Components/Inputs/Buttons/Button';
import { ConfirmButton } from '../../../Components/Inputs/Buttons/ConfirmButton';
import { Selector } from '../../../Components/Selector';
import {
  TabLayout,
  TabLayoutComponent,
} from '../../../Components/TabLayout/TabLayout';
import { tabLayoutChildrenClassNames } from '../../../Components/TabLayout/tabLayoutStyles';
import { Toolbar } from '../../../Components/Toolbar';
import { defaultMarginRight, defaultPadding } from '../../../css/classes';
import { GameModel } from '../../../data/selectors';
import { store } from '../../../data/Stores/store';
import { editorTabsTranslations } from '../../../i18n/editorTabs/editorTabs';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { librariesCTX } from '../LibrariesLoader';
import { MessageString } from '../MessageString';
import { TextPrompt } from '../TextPrompt';
import MergeEditor from './MergeEditor';
import SrcEditor, { SrcEditorProps } from './SrcEditor';
import { WegasScriptEditor } from './WegasScriptEditor';

type IVisibility = IAbstractContentDescriptor['visibility'];
const visibilities: IVisibility[] = [
  'INTERNAL',
  'PROTECTED',
  'INHERITED',
  'PRIVATE',
];

interface LibraryStatus {
  /**
   * isEdited - tells if the library is not saved yet
   */
  isEdited: boolean;
  /**
   * latestVersionLibrary - the latest version of the library
   * If defined, it means that the current library is outdated
   */
  latestVersionLibrary?: IGameModelContent;
}

interface ILibraryWithStatus {
  library: IGameModelContent;
  status: LibraryStatus;
}

interface ILibrariesWithStatus {
  [id: string]: ILibraryWithStatus;
}

/**
 * ILibrariesState is the state of every libraries of a certain type on the server
 */
interface ILibrariesState {
  /**
   * key - the name of the current edited library
   */
  selected: string;
  /**
   * libraries - the map of all libraries of a certain type on the server
   */
  libraries: ILibrariesWithStatus;
}

interface LibraryStateAction {
  /**
   * type - the type of action to dispatch
   */
  type: string;
}

interface SetUpLibrariesStateAction extends LibraryStateAction {
  type: 'SetUpLibrariesState';
  /**
   * libraries - the map of libraries of the new librariesState
   */
  libraries: ILibraries;
}

interface InsertLibraryAction extends LibraryStateAction {
  type: 'InsertLibrary';
  /**
   * name - the name of the inserted library
   */
  name: string;
  /**
   * library - the library to be inserted
   */
  library: IGameModelContent;
  /**
   * focus - should the editor display this lib.
   * Can be set to false when insertion is from external event.
   */
  focus?: boolean;
}

interface RemoveLibraryAction extends LibraryStateAction {
  type: 'RemoveLibrary';
}

interface SaveLibraryAction extends LibraryStateAction {
  type: 'SaveLibrary';
}

interface SetLibraryVisibilityAction extends LibraryStateAction {
  type: 'SetLibraryVisibility';
  /**
   * visibility - the visibility of the current library
   */
  visibility: IVisibility;
}

interface SetLibraryContentAction extends LibraryStateAction {
  type: 'SetLibraryContent';
  /**
   * content - the new content of the current library
   */
  content: string;
}

interface SetLastVersionLibraryAction extends LibraryStateAction {
  type: 'SetLastVersionLibrary';
  /**
   * name - the name of the outdated library
   */
  name: string;
  /**
   * remoteLibrary - the lastest library
   */
  latestLibrary: IGameModelContent;
}

interface SelectLibraryAction extends LibraryStateAction {
  type: 'SelectLibrary';
  /**
   * name - the name of the library to be selected
   */
  name: string;
}

type StateAction =
  | SetUpLibrariesStateAction
  | InsertLibraryAction
  | RemoveLibraryAction
  | SaveLibraryAction
  | SetLibraryVisibilityAction
  | SetLibraryContentAction
  | SetLastVersionLibraryAction
  | SelectLibraryAction;

/**
 * setLibraryState - the reducer for libraries management
 */
const setLibraryState = (oldState: ILibrariesState, action: StateAction) =>
  u(oldState, oldState => {
    switch (action.type) {
      case 'SetUpLibrariesState': {
        // Clear old libraries
        oldState.libraries = {};
        const newLibsKeys = Object.keys(action.libraries);
        newLibsKeys.map(key => {
          oldState.libraries[key] = {
            library: action.libraries[key]!!,
            status: {
              isEdited: false,
            },
          };
        });
        oldState.selected = newLibsKeys.length > 0 ? newLibsKeys[0] : '';
        break;
      }
      case 'InsertLibrary': {
        oldState.libraries[action.name] = {
          library: action.library,
          status: {
            isEdited: false,
          },
        };
        if (action.focus) {
          oldState.selected = action.name;
        }
        break;
      }
      case 'RemoveLibrary': {
        const libKeys = Object.keys(oldState.libraries);
        const oldKeyIndex = libKeys.indexOf(oldState.selected);
        const newKey =
          libKeys.length === 1
            ? ''
            : oldKeyIndex === 0
            ? libKeys[1]
            : libKeys[oldKeyIndex - 1];
        oldState.libraries = omit(oldState.libraries, oldState.selected);
        oldState.selected = newKey;
        break;
      }
      case 'SaveLibrary': {
        oldState.libraries[oldState.selected].status = {
          isEdited: false,
        };
        break;
      }
      case 'SetLibraryVisibility': {
        oldState.libraries[oldState.selected].library.visibility =
          action.visibility;
        oldState.libraries[oldState.selected].status.isEdited = true;
        break;
      }
      case 'SetLibraryContent': {
        const isEdited =
          oldState.libraries[oldState.selected].status.isEdited ||
          oldState.libraries[oldState.selected].library.content !==
            action.content;
        oldState.libraries[oldState.selected].status.isEdited = isEdited;
        oldState.libraries[oldState.selected].library.content = action.content;
        break;
      }
      case 'SetLastVersionLibrary': {
        if (
          oldState.libraries[action.name] &&
          oldState.libraries[action.name].status.isEdited &&
          oldState.libraries[action.name].library.version !==
            action.latestLibrary.version
        ) {
          //If the library is currently edited, save new library in status.latestVersionLibrary
          oldState.libraries[action.name].status.latestVersionLibrary =
            action.latestLibrary;
        } else {
          //If not, override the current library with the updated one
          oldState.libraries[action.name].library = action.latestLibrary;
        }
        break;
      }
      case 'SelectLibrary': {
        if (oldState.libraries[action.name]) {
          oldState.selected = action.name;
        }
        break;
      }
    }
    return oldState;
  });

type ScriptLanguage = 'css' | 'typescript' | 'javascript';

const extensions: Record<ScriptLanguage, string> = {
  css: 'css',
  typescript: 'ts',
  javascript: 'js',
};

/**
 * getScriptLanguage that gives a language type from a libType
 * @param scriptType - the type of library
 */
const getScriptLanguage: (scriptType: LibType) => ScriptLanguage =
  scriptType => {
    switch (scriptType) {
      case 'CSS':
        return 'css';
      case 'ServerScript':
        return 'javascript';
      case 'ClientScript':
      default:
        return 'typescript';
    }
  };

/**
 * getScriptOutdatedState is a function that looks for a lastestVersionLibrary.
 * When it returns true, it also specifies that status.latestVersionLibrary defined.
 *
 * @param libraryEntry - the library to check
 */
function isLibraryOutdated(
  libraryEntry: ILibraryWithStatus | undefined,
): libraryEntry is ILibraryWithStatus & {
  status: {
    latestVersionLibrary: IGameModelContent;
  };
} {
  return (
    libraryEntry != null &&
    libraryEntry.status.latestVersionLibrary !== undefined
  );
}

/**
 * isVisibilityAllowed is a function that tells if a visibility can be sat to the current library
 * depending on the GameModel type and the current visibility of the library
 *
 * @param librariesState - the state of the script editor
 * @param visibility - the wanted new visibility
 */
const isVisibilityAllowed = (
  librariesState: ILibrariesState,
  visibility: IVisibility,
): boolean => {
  return (
    visibility === 'PRIVATE' ||
    visibility === getLibraryVisibility(librariesState) ||
    GameModel.selectCurrent().type === 'MODEL'
  );
};

/**
 * isDeleteAllowed is a function that tells if the current library can be deleted
 *
 * @param librariesState - the state of the script editor
 */
const isDeleteAllowed = (librariesState: ILibrariesState): boolean => {
  const libEntry = librariesState.libraries[librariesState.selected];
  return (
    !isLibraryOutdated(libEntry) &&
    (GameModel.selectCurrent().type !== 'SCENARIO' ||
      libEntry.library.visibility === 'PRIVATE')
  );
};

/**
 * isDeleteAllowed is a function that tells if the current library can be edited
 *
 * @param librariesState - the state of the script editor
 */
const isEditAllowed = (librariesState: ILibrariesState): boolean => {
  const libEntry = librariesState.libraries[librariesState.selected];
  return (
    librariesState.selected !== '' &&
    (GameModel.selectCurrent().type !== 'SCENARIO' ||
      libEntry.library.visibility === 'PRIVATE' ||
      libEntry.library.visibility === 'INHERITED')
  );
};

/**
 * getLibraryVisibility is a function that tells the visibility of the selected library
 *
 * @param librariesState - the state of the script editor
 */
const getLibraryVisibility = (librariesState: ILibrariesState): IVisibility => {
  if (librariesState.selected) {
    const libEntry = librariesState.libraries[librariesState.selected];
    if (isLibraryOutdated(libEntry)) {
      return libEntry.status.latestVersionLibrary.visibility;
    } else {
      return libEntry.library.visibility;
    }
  }
  return 'PRIVATE';
};

interface ModalStateClose {
  type: 'close';
}

interface ModalStateWarn {
  type: 'warning';
  label: string;
}

interface ModalStateError {
  type: 'error';
  label: string;
}

interface ModalStateLibname {
  type: 'libname';
}

type ModalState =
  | ModalStateClose
  | ModalStateError
  | ModalStateLibname
  | ModalStateWarn;

interface ScriptEditorProps {
  /**
   * scriptType- the type of library to use ("CSS" | "ClientScript" | "ServerScript")
   */
  scriptType: LibType;
}

/**
 * ScriptEditor is a component for wegas library management
 */
function ScriptEditor({ scriptType }: ScriptEditorProps) {
  const i18nValues = useInternalTranslate(editorTabsTranslations);
  const [librariesState, dispatchStateAction] = React.useReducer(
    setLibraryState,
    {
      selected: '',
      libraries: {},
    },
  );
  const [modalState, setModalState] = React.useState<ModalState>({
    type: 'close',
  });
  const libEntry = librariesState.libraries[librariesState.selected] as
    | ILibraryWithStatus
    | undefined;

  const { updateCSSLibraries } = React.useContext(librariesCTX);
  const globalContexts = useGlobalContexts();

  /**
   * A callback for websocket event management
   */
  const websocketEventHandler = React.useCallback(
    (updatedLibraryName: string) => {
      LibraryAPI.getLibrary(scriptType, updatedLibraryName).then(
        (library: IGameModelContent) => {
          dispatchStateAction({
            type: 'SetLastVersionLibrary',
            name: updatedLibraryName,
            latestLibrary: library,
          });
        },
      );
    },
    [scriptType],
  );

  /**
   * A new pusher event is registered in order to catch external updates on libraries
   */
  useWebsocketEvent(
    ('LibraryUpdate-' + scriptType) as WebSocketEvent,
    websocketEventHandler,
  );

  /**
   * onNewLibrary insert a new library in the database
   *
   * @param name - the name of the new library
   * @param library - the library to insert in the database
   */
  const onNewLibrary = React.useCallback(
    (
      name: string | null,
      content: string = '',
      visibility: IVisibility = 'PRIVATE',
    ) => {
      if (name !== null) {
        const mimeType =
          scriptType === 'CSS'
            ? 'text/css'
            : scriptType === 'ServerScript'
            ? 'application/javascript'
            : scriptType === 'ClientScript'
            ? 'application/typescript'
            : '';
        return LibraryAPI.addLibrary(
          scriptType,
          mimeType,
          name,
          content,
          visibility,
        )
          .then((res: IGameModelContent) => {
            dispatchStateAction({
              type: 'InsertLibrary',
              name: name,
              library: res,
              focus: true,
            });
          })
          .catch((e: NewLibErrors) => {
            switch (e) {
              case 'NOTNEW':
                setModalState({
                  type: 'error',
                  label: i18nValues.scripts.scriptNameNotAvailable,
                });
                break;
              case 'UNKNOWN':
              default:
                setModalState({
                  type: 'error',
                  label: i18nValues.scripts.cannotCreateScript,
                });
            }
          });
      }
    },
    [
      i18nValues.scripts.cannotCreateScript,
      i18nValues.scripts.scriptNameNotAvailable,
      scriptType,
    ],
  );

  /**
   * onSaveLibrary updates the content of a library in the database
   *
   * @param content - the content of the library
   */
  const onSaveLibrary = React.useCallback(() => {
    if (isEditAllowed(librariesState) && libEntry != null) {
      LibraryAPI.saveLibrary(
        scriptType,
        librariesState.selected,
        libEntry.library,
      )
        .then(() => {
          dispatchStateAction({
            type: 'SaveLibrary',
          });
          if (scriptType === 'ClientScript') {
            try {
              setGlobals(globalContexts, store.getState());
              clientScriptEval(libEntry.library.content, undefined, undefined, {
                moduleName: `./${librariesState.selected}`,
                injectReturn: false,
              });
            } catch (e) {
              setModalState({
                type: 'warning',
                label: i18nValues.scripts.librarySavedErrors,
              });
            }
          } else if (scriptType === 'CSS') {
            updateCSSLibraries(librariesState.selected);
          }
        })
        .catch(() => {
          setModalState({
            type: 'error',
            label: i18nValues.scripts.libraryCannotSave,
          });
        });
    }
  }, [
    librariesState,
    libEntry,
    scriptType,
    globalContexts,
    i18nValues.scripts.librarySavedErrors,
    i18nValues.scripts.libraryCannotSave,
    updateCSSLibraries,
  ]);

  /**
   * onDeleteLibrary deletes the selected library in the database
   */
  const onDeleteLibrary = React.useCallback(() => {
    LibraryAPI.deleteLibrary(scriptType, librariesState.selected)
      .then(() => {
        if (librariesState.selected) {
          dispatchStateAction({
            type: 'RemoveLibrary',
          });
        }
      })
      .catch(() => {
        i18nValues.scripts.libraryCannotDelete;
        setModalState({
          type: 'error',
          label: i18nValues.scripts.cannotDeleteScript,
        });
      });
  }, [
    i18nValues.scripts.cannotDeleteScript,
    i18nValues.scripts.libraryCannotDelete,
    librariesState.selected,
    scriptType,
  ]);

  const downloadCb = React.useCallback(() => {
    const content =
      librariesState.libraries[librariesState.selected].library.content;

    const extension = extensions[getScriptLanguage(scriptType)];
    const filename = `${librariesState.selected}.${extension}`;

    const anchor: HTMLAnchorElement = document.createElement('a');
    anchor.setAttribute(
      'href',
      'data:text/plain;charset=utf-8,' + encodeURIComponent(content),
    );
    anchor.setAttribute('download', filename);
    anchor.click();
  }, [librariesState.selected, librariesState.libraries, scriptType]);

  /**
   * When scriptType changes, gets all libraries of this type and refresh the librariesState
   */
  React.useEffect(() => {
    LibraryAPI.getAllLibraries(scriptType)
      .then((libs: ILibraries) => {
        dispatchStateAction({ type: 'SetUpLibrariesState', libraries: libs });
      })
      .catch(() => {
        setModalState({
          type: 'error',
          label: i18nValues.scripts.cannotGetScripts,
        });
      });
  }, [i18nValues.scripts.cannotGetScripts, scriptType]);

  function onChange(content: string) {
    dispatchStateAction({
      type: 'SetLibraryContent',
      content: content,
    });
  }

  const editorProps: SrcEditorProps = React.useMemo(() => {
    const language = getScriptLanguage(scriptType);
    const extension = extensions[language];

    const models = Object.entries(librariesState.libraries).reduce<
      Record<string, string>
    >((acc, [key, value]) => {
      acc[`file:///${key}.${extension}`] = value.library.content;
      return acc;
    }, {});

    return {
      fileName: `file:///${librariesState.selected}.${extension}`,
      onChange: onChange,
      language: language,
      readOnly: !isEditAllowed(librariesState),
      onSave: onSaveLibrary,
      models: models,
    };
  }, [librariesState, onSaveLibrary, scriptType]);

  return (
    <Toolbar>
      <Toolbar.Header className={defaultPadding}>
        {modalState.type === 'libname' ? (
          <TextPrompt
            placeholder={i18nValues.scripts.libraryName}
            defaultFocus
            onAction={(success, value) => {
              if (value === '') {
                setModalState({
                  type: 'error',
                  label: i18nValues.scripts.libraryMustName,
                });
              } else {
                if (success) {
                  onNewLibrary(value);
                  setModalState({ type: 'close' });
                }
              }
            }}
            onBlur={() =>
              setModalState(current =>
                current.type !== 'close' ? { type: 'close' } : current,
              )
            }
            applyOnEnter
          />
        ) : (
          <>
            <Button
              icon="plus"
              tooltip={i18nValues.scripts.addNewScript}
              onClick={() => {
                setModalState({ type: 'libname' });
              }}
            />
            {librariesState.selected && (
              <>
                <Selector
                  value={
                    librariesState.selected
                      ? librariesState.selected
                      : i18nValues.scripts.noLibrarySelected
                  }
                  choices={Object.entries(librariesState.libraries)
                    .sort((a, b) => a[0].localeCompare(b[0])).map(
                    ([key, value]) => ({
                      value: key,
                      label: value.status.isEdited ? `* ${key}` : key,
                    }),
                  )}
                  onChange={value =>
                    dispatchStateAction({
                      type: 'SelectLibrary',
                      name: value,
                    })
                  }
                  allowUndefined={false}
                  className={cx(defaultMarginRight, css({ width: '10em' }))}
                />
                <Selector
                  value={getLibraryVisibility(librariesState)}
                  choices={visibilities
                    .filter(v => isVisibilityAllowed(librariesState, v))
                    .map(v => ({
                      value: v,
                      label: v,
                    }))}
                  onChange={value =>
                    dispatchStateAction({
                      type: 'SetLibraryVisibility',
                      visibility: value as IVisibility,
                    })
                  }
                  className={cx(defaultMarginRight, css({ width: '10em' }))}
                />
                {!isLibraryOutdated(libEntry) && (
                  <>
                    {isEditAllowed(librariesState) && (
                      <Button
                        icon="save"
                        tooltip={i18nValues.scripts.saveScript}
                        onClick={onSaveLibrary}
                      />
                    )}
                    {isDeleteAllowed(librariesState) && (
                      <ConfirmButton
                        icon="trash"
                        tooltip={i18nValues.scripts.deleteScript}
                        onAction={success => success && onDeleteLibrary()}
                        onBlur={() => {
                          setModalState(current =>
                            current.type !== 'close'
                              ? { type: 'close' }
                              : current,
                          );
                        }}
                      />
                    )}
                    <Button
                      icon="download"
                      tooltip={i18nValues.scripts.downloadScript}
                      onClick={downloadCb}
                    />
                  </>
                )}
                {modalState.type === 'error' ||
                modalState.type === 'warning' ? (
                  <MessageString
                    type={modalState.type}
                    value={modalState.label}
                    duration={3000}
                    onLabelVanish={() => {
                      setModalState({ type: 'close' });
                    }}
                  />
                ) : (
                  libEntry &&
                  (isLibraryOutdated(libEntry) ? (
                    <MessageString
                      type="error"
                      value={i18nValues.scripts.scriptDangerOutdate}
                    />
                  ) : libEntry.status.isEdited ? (
                    <MessageString
                      type="warning"
                      value={i18nValues.scripts.scriptNotSaved}
                    />
                  ) : (
                    <MessageString
                      type="succes"
                      value={i18nValues.scripts.scriptSaved}
                      duration={3000}
                    />
                  ))
                )}
              </>
            )}
          </>
        )}
      </Toolbar.Header>
      <Toolbar.Content>
        {librariesState.selected && isLibraryOutdated(libEntry) ? (
          <MergeEditor
            fileName={`${librariesState.selected}_${scriptType}`}
            originalValue={libEntry.status.latestVersionLibrary.content}
            modifiedValue={libEntry.library.content}
            language={getScriptLanguage(scriptType)}
            onChange={onChange}
            onResolved={onSaveLibrary}
          />
        ) : librariesState.selected ? (
          getScriptLanguage(scriptType) === 'css' ? (
            <SrcEditor {...editorProps} />
          ) : (
            <WegasScriptEditor
              {...editorProps}
              scriptContext={
                scriptType === 'ServerScript' ? 'Server external' : 'Client'
              }
            />
          )
        ) : (
          <MessageString
            value={i18nValues.scripts.createLibraryPlease}
            type={'warning'}
          />
        )}
      </Toolbar.Content>
    </Toolbar>
  );
}

export default function LibraryEditor() {
  const components: TabLayoutComponent[] = [
    {
      tabId: 'Styles',
      content: <ScriptEditor scriptType="CSS" />,
    },
    {
      tabId: 'Client',
      content: <ScriptEditor scriptType="ClientScript" />,
    },
    {
      tabId: 'Server',
      content: <ScriptEditor scriptType="ServerScript" />,
    },
  ];
  return (
    <TabLayout
      components={components}
      classNames={tabLayoutChildrenClassNames}
    />
  );
}
