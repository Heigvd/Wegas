import * as React from 'react';
import { TabLayout } from '../../../Components/Tabs';
import { Toolbar } from '../../../Components/Toolbar';
import { IconButton } from '../../../Components/Button/IconButton';
import { LibraryAPI, NewLibErrors, LibType } from '../../../API/library.api';
import { GameModel } from '../../../data/selectors';
import SrcEditor from './SrcEditor';
import { omit } from 'lodash-es';
import u from 'immer';
import { DiffEditor } from './DiffEditor';
import { themeVar } from '../../../Components/Theme';
import { css } from 'emotion';
import { WebSocketEvent, useWebsocket } from '../../../API/websocket';

function StyledLabel({
  type,
  value,
}: {
  type: 'normal' | 'warning' | 'error' | 'succes';
  value: string;
}) {
  let color = '';

  switch (type) {
    case 'succes': {
      color = themeVar.successColor;
      break;
    }
    case 'normal': {
      color = themeVar.primaryLighterColor;
      break;
    }
    case 'warning': {
      color = themeVar.warningColor;
      break;
    }
    case 'error': {
      color = themeVar.errorColor;
      break;
    }
  }

  return (
    <div
      className={css({
        color: color,
        padding: '5px',
      })}
    >
      {value}
    </div>
  );
}

interface ScriptEditorProps {
  scriptType: LibType;
}

const visibilities: IVisibility[] = [
  'INTERNAL',
  'PROTECTED',
  'INHERITED',
  'PRIVATE',
];

interface LibraryStatus {
  isEdited: boolean;
  upToDateLibrary?: ILibrary;
}

interface ILibrariesWithState {
  [id: string]: {
    library: ILibrary;
    status: LibraryStatus;
  };
}

interface ILibrariesState {
  key: string;
  libraries: ILibrariesWithState;
  tempLibrary: ILibrary;
  tempStatus: LibraryStatus;
}

interface LibraryStateAction {
  type: string;
}

interface SetVisibilityAction extends LibraryStateAction {
  type: 'SetVisibility';
  visibility: IVisibility;
}

interface InsertAction extends LibraryStateAction {
  type: 'Insert';
  key: string;
  library: ILibrary;
  focus?: boolean;
}

interface RemoveAction extends LibraryStateAction {
  type: 'Remove';
  key: string;
}

interface SetKeyAction extends LibraryStateAction {
  type: 'SetKey';
  key: string;
}

interface SetContentAction extends LibraryStateAction {
  type: 'SetContent';
  content: string;
}

interface InsertMultipleAction extends LibraryStateAction {
  type: 'InsertMultiple';
  libraries: ILibraries;
}

interface SaveContent extends LibraryStateAction {
  type: 'SaveContent';
  content: string;
  key: string;
  scriptType: LibType;
}

interface CheckRemoteModification extends LibraryStateAction {
  type: 'RemoteModified';
  key: string;
  remoteLibrary: ILibrary;
}

type StateAction =
  | SetVisibilityAction
  | InsertAction
  | RemoveAction
  | SetKeyAction
  | SetContentAction
  | InsertMultipleAction
  | SaveContent
  | CheckRemoteModification;

const setLibraryState = (oldState: ILibrariesState, action: StateAction) =>
  u(oldState, oldState => {
    switch (action.type) {
      case 'SetVisibility': {
        if (oldState.key) {
          oldState.libraries[oldState.key].library.visibility =
            action.visibility;
          oldState.libraries[oldState.key].status.isEdited = true;
        } else {
          oldState.tempLibrary.visibility = action.visibility;
          oldState.tempStatus.isEdited = true;
        }
        break;
      }
      case 'Insert': {
        oldState.libraries[action.key] = {
          library: action.library,
          status: {
            isEdited: false,
          },
        };
        if (action.focus) {
          oldState.key = action.key;
        }
        break;
      }
      case 'Remove': {
        if (oldState.libraries[action.key]) {
          const libKeys = Object.keys(oldState.libraries);
          const oldKeyIndex = libKeys.indexOf(action.key);
          const newKey =
            libKeys.length === 1
              ? ''
              : oldKeyIndex === 0
              ? libKeys[1]
              : libKeys[oldKeyIndex - 1];
          oldState.libraries = omit(oldState.libraries, action.key);
          oldState.key = newKey;
        }
        break;
      }
      case 'SetKey': {
        oldState.key = action.key;
        break;
      }
      case 'SaveContent':
      case 'SetContent': {
        const newKey =
          action.type === 'SaveContent' && action.key
            ? action.key
            : oldState.key;
        if (newKey !== '') {
          const isEdited =
            oldState.libraries[newKey].status.isEdited ||
            oldState.libraries[newKey].library.content !== action.content;
          oldState.libraries[newKey].status.isEdited = isEdited;
          oldState.libraries[newKey].library.content = action.content;
        } else {
          const isEdited =
            oldState.tempStatus.isEdited ||
            oldState.tempLibrary.content !== action.content;
          oldState.tempStatus.isEdited = isEdited;
          oldState.tempLibrary.content = action.content;
        }

        if (action.type === 'SaveContent') {
          oldState.libraries[newKey].status = {
            isEdited: false,
          };
          LibraryAPI.saveLibrary(
            action.scriptType,
            newKey,
            oldState.libraries[newKey].library,
          ).catch(() => {
            alert('Cannot save the script');
          });
        }

        break;
      }
      case 'InsertMultiple': {
        const newLibsKeys = Object.keys(action.libraries);
        newLibsKeys.map(key => {
          oldState.libraries[key] = {
            library: action.libraries[key],
            status: {
              isEdited: false,
            },
          };
        });
        const libKeys = Object.keys(oldState.libraries);
        if (!oldState.key && libKeys.length > 0) {
          oldState.key = libKeys[0];
        }
        break;
      }
      case 'RemoteModified': {
        if (
          oldState.libraries[action.key] &&
          oldState.libraries[action.key].status.isEdited &&
          oldState.libraries[action.key].library.version !==
            action.remoteLibrary.version
        ) {
          oldState.libraries[action.key].status.upToDateLibrary =
            action.remoteLibrary;
        } else {
          oldState.libraries[action.key].library = action.remoteLibrary;
        }
        break;
      }
    }

    return oldState;
  });

function ScriptEditor({ scriptType }: ScriptEditorProps) {
  const gameModel = GameModel.selectCurrent();
  const librarySelectorId = 'library-selector';
  const visibilitySelectorId = 'visibility-selector';

  const [librariesState, dispatchStateAction] = React.useReducer(
    setLibraryState,
    {
      key: '',
      libraries: {},
      tempLibrary: {
        content: '',
        visibility: 'PRIVATE',
      },
      tempStatus: {
        isEdited: false,
      },
    },
  );

  const onScriptEvent = (data: string) => {
    LibraryAPI.getLibrary(scriptType, data).then((res: ILibrary) => {
      dispatchStateAction({
        type: 'RemoteModified',
        key: data,
        remoteLibrary: res,
      });
    });
  };

  useWebsocket(
    ('LibraryUpdate-' + scriptType) as WebSocketEvent,
    onScriptEvent,
  );

  let scriptLanguage: 'css' | 'javascript';

  switch (scriptType) {
    case 'CSS':
      scriptLanguage = 'css';
      break;
    case 'ClientScript':
    case 'ServerScript':
    default:
      scriptLanguage = 'javascript';
  }

  const getVisibilitySelector = () => {
    return document.getElementById(visibilitySelectorId)! as HTMLInputElement;
  };

  const removeLibrary = (name: string) => {
    dispatchStateAction({ type: 'Remove', key: name });
  };

  const onLibraryChange = (selector: React.ChangeEvent<HTMLSelectElement>) => {
    dispatchStateAction({ type: 'SetKey', key: selector.target.value });
  };

  const onVisibilityChange = (
    selector: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    dispatchStateAction({
      type: 'SetVisibility',
      visibility: selector.target.value as IVisibility,
    });
  };

  const onNewLibrary = React.useCallback(
    (name: string | null, library?: ILibrary) => {
      if (name !== null) {
        return LibraryAPI.addLibrary(scriptType, name, library)
          .then((res: ILibrary) => {
            dispatchStateAction({
              type: 'Insert',
              key: name,
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

  const onSaveLibrary = React.useCallback(
    (content: string) => {
      let libKey: string | null = librariesState.key;
      if (!libKey) {
        libKey = prompt('Please enter a script name');
        if (libKey) {
          onNewLibrary(libKey, {
            content: content,
            visibility: getVisibilitySelector().value as IVisibility,
          });
        }
      } else {
        dispatchStateAction({
          type: 'SaveContent',
          key: libKey,
          content: content,
          scriptType: scriptType,
        });
      }
    },
    [librariesState.key, onNewLibrary, scriptType],
  );

  const onDeleteLibrary = () => {
    if (confirm('Are you sure you want to delete this library?')) {
      LibraryAPI.deleteLibrary(scriptType, librariesState.key)
        .then(() => {
          removeLibrary(librariesState.key);
        })
        .catch(() => {
          alert('Cannot delete the script');
        });
    }
  };

  const onContentChange = React.useCallback((content: string) => {
    dispatchStateAction({ type: 'SetContent', content: content });
  }, []);

  const getScriptOutdatedState = (
    libraryEntry: { library: ILibrary; status: LibraryStatus } | undefined,
  ): libraryEntry is { library: ILibrary; status: LibraryStatus } & {
    status: {
      upToDateLibrary: ILibrary;
    };
  } => {
    return (
      libraryEntry !== undefined &&
      libraryEntry.status.upToDateLibrary !== undefined
    );
  };

  const getScriptEditingState = (): boolean => {
    return (
      (!librariesState.key && librariesState.tempStatus.isEdited) ||
      (librariesState.libraries[librariesState.key] &&
        librariesState.libraries[librariesState.key].status.isEdited)
    );
  };

  const getActualScriptContent = (): string => {
    return librariesState.libraries[librariesState.key]
      ? librariesState.libraries[librariesState.key].library.content
      : !librariesState.key
      ? librariesState.tempLibrary.content
      : '';
  };

  const getActualScriptVisibility = (): IVisibility => {
    if (librariesState.key) {
      const libEntry = librariesState.libraries[librariesState.key];
      if (getScriptOutdatedState(libEntry)) {
        return libEntry.status.upToDateLibrary.visibility;
      } else {
        const locLib = libEntry;
        if (locLib) {
          return locLib.library.visibility;
        }
      }
    }
    return librariesState.tempLibrary.visibility;
  };

  const isVisibilityAllowed = (visibility: IVisibility): boolean => {
    const currentVisibility: IVisibility = librariesState.key
      ? librariesState.libraries[librariesState.key].library.visibility
      : 'PRIVATE';
    let allowedVisibilities: IVisibility[] = [];

    if (
      gameModel.type === 'MODEL' ||
      (gameModel.type === 'REFERENCE' && librariesState.key)
    ) {
      allowedVisibilities = ['INHERITED', 'INTERNAL', 'PRIVATE', 'PROTECTED'];
    } else if (librariesState.key) {
      allowedVisibilities.push(currentVisibility);
    } else {
      allowedVisibilities.push('PRIVATE');
    }

    return allowedVisibilities.indexOf(visibility) !== -1;
  };

  const isDeleteAllowed = (): boolean => {
    const libEntry = librariesState.libraries[librariesState.key];
    if (getScriptOutdatedState(libEntry)) {
      return false;
    } else if (!librariesState.key) {
      return false;
    } else if (
      gameModel.type === 'SCENARIO' &&
      libEntry.library.visibility !== 'PRIVATE'
    ) {
      return false;
    } else {
      return true;
    }
  };

  const isEditAllowed = (): boolean => {
    const libEntry = librariesState.libraries[librariesState.key];
    if (getScriptOutdatedState(libEntry)) {
      return false;
    } else if (!librariesState.key) {
      return true;
    } else if (
      gameModel.type === 'SCENARIO' &&
      libEntry.library.visibility !== 'PRIVATE' &&
      libEntry.library.visibility !== 'INHERITED'
    ) {
      return false;
    } else {
      return true;
    }
  };

  React.useEffect(() => {
    // Loading libraries
    LibraryAPI.getAllLibraries(scriptType)
      .then((libs: ILibraries) => {
        dispatchStateAction({ type: 'InsertMultiple', libraries: libs });
      })
      .catch(() => {
        alert('Cannot get the scripts');
      });
  }, [scriptType]);

  const libEntry = librariesState.libraries[librariesState.key];

  return (
    <Toolbar>
      <Toolbar.Header>
        <IconButton
          icon="plus"
          tooltip="Add a new script"
          onClick={() => {
            if (!librariesState.key) {
              onSaveLibrary(librariesState.tempLibrary.content); //Force save temporary content
            } else {
              onNewLibrary(prompt('Type the name of the script'));
            }
          }}
        />
        <select
          id={librarySelectorId}
          onChange={onLibraryChange}
          value={librariesState.key}
        >
          {Object.keys(librariesState.libraries).length > 0 ? (
            Object.keys(librariesState.libraries).map((key: string) => {
              return (
                <option key={key} value={key}>
                  {key}
                </option>
              );
            })
          ) : (
            <option key={''} value="">
              No script
            </option>
          )}
        </select>
        <select
          id={visibilitySelectorId}
          onChange={onVisibilityChange}
          value={getActualScriptVisibility()}
        >
          {visibilities.map((item, key) => {
            return (
              <option
                key={key}
                hidden={!isVisibilityAllowed(item)}
                value={item}
              >
                {item}
              </option>
            );
          })}
        </select>
        {isEditAllowed() && (
          <IconButton
            icon="save"
            tooltip="Save the script"
            onClick={() => onSaveLibrary(libEntry.library.content)}
          />
        )}
        {isDeleteAllowed() && (
          <IconButton
            icon="trash"
            tooltip="Delete the script"
            onClick={onDeleteLibrary}
          />
        )}
        {getScriptOutdatedState(libEntry) ? (
          <StyledLabel
            type="error"
            value="The script is dangeroulsy outdated!"
          />
        ) : getScriptEditingState() ? (
          <StyledLabel type="warning" value="The script is not saved" />
        ) : (
          <StyledLabel type="normal" value="The script is saved" />
        )}
      </Toolbar.Header>
      <Toolbar.Content>
        {getScriptOutdatedState(libEntry) ? (
          <DiffEditor
            originalContent={libEntry.status.upToDateLibrary.content}
            modifiedContent={libEntry.library.content}
            language={scriptLanguage}
            onResolved={onSaveLibrary}
          />
        ) : (
          <SrcEditor
            value={getActualScriptContent()}
            language={scriptLanguage}
            onBlur={onContentChange}
            readonly={!isEditAllowed()}
            onSave={onSaveLibrary}
          />
        )}
      </Toolbar.Content>
    </Toolbar>
  );
}

export default function ScriptEditorLayout() {
  return (
    <TabLayout tabs={['Styles', 'Client', 'Server']}>
      <ScriptEditor scriptType="CSS" />
      <ScriptEditor scriptType="ClientScript" />
      <ScriptEditor scriptType="ServerScript" />
    </TabLayout>
  );
}
