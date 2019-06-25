import * as React from 'react';
import { TabLayout } from '../../../Components/Tabs';
import { Toolbar } from '../../../Components/Toolbar';
import { IconButton } from '../../../Components/Button/IconButton';
import {
  LibraryAPI,
  NewLibErrors,
  LibType,
  ILibraries,
} from '../../../API/library.api';
import { GameModel } from '../../../data/selectors';
import { omit } from 'lodash-es';
import u from 'immer';
import { WebSocketEvent, useWebsocket } from '../../../API/websocket';
import SrcEditor from './SrcEditor';
import MergeEditor from './MergeEditor';
import { StyledLabel } from '../../../Components/AutoImport/String/Label';

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

/**
 * getScriptLanguage that gives a language type from a libType
 * @param scriptType - the type of library
 */
const getScriptLanguage: (
  scriptType: LibType,
) => 'css' | 'javascript' = scriptType => {
  switch (scriptType) {
    case 'CSS':
      return 'css';
    case 'ClientScript':
    case 'ServerScript':
    default:
      return 'javascript';
  }
};

/**
 * getScriptOutdatedState is a function that looks for a lastestVersionLibrary.
 * When it returns true, it also specifies that status.latestVersionLibrary defined.
 *
 * @param libraryEntry - the library to check
 */
const isLibraryOutdated = (
  libraryEntry: ILibraryWithStatus,
): libraryEntry is ILibraryWithStatus & {
  status: {
    latestVersionLibrary: IGameModelContent;
  };
} => {
  return libraryEntry.status.latestVersionLibrary !== undefined;
};

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
      (libEntry.library.visibility === 'PRIVATE' ||
        libEntry.library.visibility === 'INHERITED'))
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
  const librarySelector = React.useRef<HTMLSelectElement>(null);
  const visibilitySelector = React.useRef<HTMLSelectElement>(null);
  const [librariesState, dispatchStateAction] = React.useReducer(
    setLibraryState,
    {
      selected: '',
      libraries: {},
    },
  );

  /**
   * A new pusher event is registered in order to catch external updates on libraries
   */
  useWebsocket(
    ('LibraryUpdate-' + scriptType) as WebSocketEvent,
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
        return LibraryAPI.addLibrary(scriptType, name, content, visibility)
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
                alert(
                  'Script name not available (script already exists or the name contains bad characters)',
                );
                break;
              case 'UNKNOWN':
              default:
                alert('Cannot create the script');
            }
          });
      }
    },
    [scriptType],
  );

  /**
   * onSaveLibrary updates the content of a library in the database
   *
   * @param content - the content of the library
   */
  const onSaveLibrary = React.useCallback(
    (content: string) => {
      let libKey: string | null = librariesState.selected;
      if (!libKey) {
        // If no library is yet selected (tipically when there is no library of this type in the db)
        // Ask for a name and insert content as new library
        libKey = prompt('Please enter a script name');
        if (libKey) {
          onNewLibrary(libKey, content);
        }
      } else {
        if (isEditAllowed(librariesState)) {
          LibraryAPI.saveLibrary(
            scriptType,
            librariesState.selected,
            librariesState.libraries[librariesState.selected].library,
          )
            .catch(() => {
              alert('The library cannot be saved');
            })
            .then(() => {
              dispatchStateAction({
                type: 'SaveLibrary',
              });
            });
        }
      }
    },
    [librariesState, onNewLibrary, scriptType],
  );

  /**
   * onDeleteLibrary deletes the selected library in the database
   */
  const onDeleteLibrary = () => {
    if (confirm('Are you sure you want to delete this library?')) {
      LibraryAPI.deleteLibrary(scriptType, librariesState.selected)
        .then(() => {
          if (librarySelector.current) {
            dispatchStateAction({
              type: 'RemoveLibrary',
            });
          }
        })
        .catch(() => {
          alert('Cannot delete the script');
        });
    }
  };

  /**
   * When scriptType changes, gets all libraries of this type and refresh the librariesState
   */
  React.useEffect(() => {
    LibraryAPI.getAllLibraries(scriptType)
      .then((libs: ILibraries) => {
        dispatchStateAction({ type: 'SetUpLibrariesState', libraries: libs });
      })
      .catch(() => {
        alert('Cannot get the scripts');
      });
  }, [scriptType]);

  React.useEffect(() => {}, [librariesState]);

  const libEntry = librariesState.libraries[librariesState.selected];

  return (
    <Toolbar>
      <Toolbar.Header>
        <IconButton
          icon="plus"
          tooltip="Add a new script"
          onClick={() => {
            onNewLibrary(prompt('Type the name of the script'));
          }}
        />
        {librariesState.selected && (
          <>
            <select
              ref={librarySelector}
              onChange={selector => {
                dispatchStateAction({
                  type: 'SelectLibrary',
                  name: selector.target.value,
                });
              }}
              value={librariesState.selected}
            >
              {Object.keys(librariesState.libraries).map((name: string) => {
                return (
                  <option key={name} value={name}>
                    {name}
                  </option>
                );
              })}
            </select>
            <select
              ref={visibilitySelector}
              onChange={selector =>
                dispatchStateAction({
                  type: 'SetLibraryVisibility',
                  visibility: selector.target.value as IVisibility,
                })
              }
              value={getLibraryVisibility(librariesState)}
            >
              {visibilities.map((visibility, key) => {
                return (
                  <option
                    key={key}
                    hidden={!isVisibilityAllowed(librariesState, visibility)}
                    value={visibility}
                  >
                    {visibility}
                  </option>
                );
              })}
            </select>
            {!isLibraryOutdated(libEntry) && (
              <>
                {isEditAllowed(librariesState) && (
                  <IconButton
                    icon="save"
                    tooltip="Save the script"
                    onClick={() => onSaveLibrary(libEntry.library.content)}
                  />
                )}
                {isDeleteAllowed(librariesState) && (
                  <IconButton
                    icon="trash"
                    tooltip="Delete the script"
                    onClick={onDeleteLibrary}
                  />
                )}
              </>
            )}
            {isLibraryOutdated(libEntry) ? (
              <StyledLabel
                type="error"
                value="The script is dangeroulsy outdated!"
              />
            ) : libEntry.status.isEdited ? (
              <StyledLabel type="warning" value="The script is not saved" />
            ) : (
              <StyledLabel type="normal" value="The script is saved" />
            )}
          </>
        )}
      </Toolbar.Header>
      <Toolbar.Content>
        {librariesState.selected && isLibraryOutdated(libEntry) ? (
          <MergeEditor
            originalValue={libEntry.status.latestVersionLibrary.content}
            modifiedValue={libEntry.library.content}
            language={getScriptLanguage(scriptType)}
            onChange={content =>
              dispatchStateAction({
                type: 'SetLibraryContent',
                content: content,
              })
            }
            onResolved={onSaveLibrary}
          />
        ) : (
          <SrcEditor
            value={
              librariesState.selected
                ? librariesState.libraries[librariesState.selected].library
                    .content
                : ''
            }
            onChange={content =>
              dispatchStateAction({
                type: 'SetLibraryContent',
                content: content,
              })
            }
            language={getScriptLanguage(scriptType)}
            readonly={!isEditAllowed(librariesState)}
            onSave={onSaveLibrary}
          />
        )}
      </Toolbar.Content>
    </Toolbar>
  );
}

export default function LibraryEditor() {
  return (
    <TabLayout tabs={['Styles', 'Client', 'Server']}>
      <ScriptEditor scriptType="CSS" />
      <ScriptEditor scriptType="ClientScript" />
      <ScriptEditor scriptType="ServerScript" />
    </TabLayout>
  );
}
