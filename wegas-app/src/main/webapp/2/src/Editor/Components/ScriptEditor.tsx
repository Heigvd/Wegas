import * as React from 'react';
import { TabLayout } from '../../Components/Tabs';
import { Toolbar } from '../../Components/Toolbar';
import { IconButton } from '../../Components/Button/IconButton';
import { LibraryApi, NewLibErrors, LibType } from '../../API/library.api';
import { GameModel } from '../../data/selectors';
import SrcEditor from './SrcEditor';
import { StoreConsumer, StoreDispatch } from '../../data/store';
import { State } from '../../data/Reducer/reducers';
import { LibraryState } from '../../data/Reducer/libraryState';
import { omit } from 'lodash-es';
import u from 'immer';
import { Reducer } from 'redux';
import { DiffEditor } from './DiffEditor';

interface ScriptEditorLayoutProps {
  librariesState: LibraryState;
  dispatch: StoreDispatch;
}

interface ScriptEditorProps {
  librariesState: LibraryState;
  scriptType: LibType;
  dispatch: StoreDispatch;
}

const visibilities: IVisibility[] = [
  'INTERNAL',
  'PROTECTED',
  'INHERITED',
  'PRIVATE',
];

interface LibraryStatus {
  isEdited: boolean;
  isOutdated: boolean;
  // isDeleted: boolean;
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

function ScriptEditor(props: ScriptEditorProps) {
  const gameModelId = GameModel.selectCurrent().id!;
  const gameModel = GameModel.selectCurrent();
  const librarySelectorId = 'library-selector';
  const visibilitySelectorId = 'visibility-selector';

  const [librariesState, setLibrariesState] = React.useState<ILibrariesState>({
    key: '',
    libraries: {},
    tempLibrary: {
      content: '',
      visibility: 'PRIVATE',
    },
    tempStatus: {
      isEdited: false,
      isOutdated: false,
      // isDeleted: false,
    },
  });

  let scriptLanguage: 'css' | 'javascript';

  switch (props.scriptType) {
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

  const getLibrarySelector = () => {
    return document.getElementById(librarySelectorId)! as HTMLInputElement;
  };

  const setLibraryEdition = (isEdited: boolean) => {
    setLibrariesState((oldState: ILibrariesState) => {
      if (oldState.key) {
        const newLibs = oldState.libraries;
        newLibs[oldState.key].status.isEdited = isEdited;
        return { ...oldState, libraries: newLibs };
      } else {
        return {
          ...oldState,
          tempStatus: {
            ...oldState.tempStatus,
            isEdited: isEdited,
          },
        };
      }
    });
  };

  const setLibraryOutdated = (outdated: boolean, name?: string) => {
    setLibrariesState((oldState: ILibrariesState) => {
      name = name ? name : oldState.key;
      if (name) {
        let newLib = oldState.libraries[name];
        if (newLib) {
          newLib.status.isOutdated = outdated;
          return {
            ...oldState,
            libraries: {
              ...oldState.libraries,
              name: newLib,
            },
          };
        }
      }
      return oldState;
    });
  };

  const setLibraryVisibility = (visibility: IVisibility) => {
    setLibrariesState((oldState: ILibrariesState) => {
      if (oldState.key) {
        const newLibs = oldState.libraries;
        newLibs[oldState.key].library.visibility = visibility;
        return { ...oldState, libraries: newLibs };
      } else {
        return {
          ...oldState,
          tempLibrary: {
            ...oldState.tempLibrary,
            visibility: visibility,
          },
        };
      }
    });
  };

  const updateOrCreateLibrary = async (name: string, library: ILibrary) => {
    await setLibrariesState((oldState: ILibrariesState) => {
      const libraryState: Reducer<Readonly<ILibrariesState>> = u(
        (state: ILibrariesState) => {
          state.libraries[name] = {
            library: library,
            status: {
              isEdited: false,
              isOutdated: false,
              // isDeleted: false,
            },
          };
          return state;
        },
      );
      const test: ReturnType<any> = {};
      return libraryState(oldState, test);
    });
  };

  const removeLibrary = (name: string) => {
    setLibrariesState((oldState: ILibrariesState) => {
      return { ...oldState, libraries: omit(oldState.libraries, name) };
    });
  };

  const onLibraryChange = () => {
    setLibrariesState((oldState: ILibrariesState) => {
      const newKey = getLibrarySelector().value;
      getVisibilitySelector().value =
        librariesState.libraries[newKey].library.visibility;
      return {
        ...oldState,
        key: newKey,
        libraries: oldState.libraries,
      };
    });
  };

  const onVisibilityChange = () => {
    setLibraryEdition(true);
    setLibraryVisibility(getVisibilitySelector().value as IVisibility);
  };

  const onNewLibrary = (name: string | null, library?: ILibrary) => {
    if (name !== null) {
      return LibraryApi.addLibrary(gameModelId, props.scriptType, name, library)
        .then((res: ILibrary) => {
          updateOrCreateLibrary(name, res).then(() => {
            setLibrariesState((oldState: ILibrariesState) => {
              return {
                ...oldState,
                key: name,
              };
            });
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
  };

  const onSaveLibrary = () => {
    let libKey: string | null = librariesState.key;
    if (!libKey) {
      libKey = prompt('Please enter a script name');
      if (libKey) {
        onNewLibrary(libKey, {
          content: librariesState.tempLibrary.content,
          visibility: getVisibilitySelector().value as IVisibility,
        });
      }
    } else {
      LibraryApi.saveLibrary(
        gameModelId,
        props.scriptType,
        libKey,
        librariesState.libraries[libKey].library,
      )
        .then(() => {
          setLibraryEdition(false);
          setLibraryOutdated(false);
        })
        .catch(() => {
          alert('Cannot save the script');
        });
    }
  };

  const onDeleteLibrary = () => {
    if (confirm('Are you sure you want to delete this library?')) {
      LibraryApi.deleteLibrary(
        gameModelId,
        props.scriptType,
        librariesState.key,
      )
        .then(() => {
          console.log('delete library');
          removeLibrary(librariesState.key);
        })
        .catch(() => {
          alert('Cannot delete the script');
        });
    }
  };

  const onContentChange = (content: string) => {
    setLibrariesState((oldState: ILibrariesState) => {
      if (oldState.key !== '') {
        const newLibs = oldState.libraries;
        newLibs[oldState.key].status.isEdited =
          newLibs[oldState.key].status.isEdited ||
          oldState.libraries[oldState.key].library.content !== content;
        newLibs[oldState.key].library.content = content;
        return {
          ...oldState,
          libraries: newLibs,
        };
      } else {
        return {
          ...oldState,
          tempLibrary: {
            ...oldState.tempLibrary,
            content: content,
          },
          tempStatus: {
            ...oldState.tempStatus,
            isEdited: oldState.tempLibrary.content !== content,
          },
        };
      }
    });
  };

  const getScriptOutdatedState = (): boolean => {
    return (
      librariesState.libraries[librariesState.key] &&
      librariesState.libraries[librariesState.key].status.isOutdated
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
    console.log(librariesState);
    return librariesState.key
      ? getScriptOutdatedState()
        ? props.librariesState[props.scriptType][librariesState.key].visibility
        : librariesState.libraries[librariesState.key].library.visibility
      : librariesState.tempLibrary.visibility;
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
    if (getScriptOutdatedState()) {
      return false;
    } else if (!librariesState.key) {
      return false;
    } else if (
      gameModel.type === 'SCENARIO' &&
      librariesState.libraries[librariesState.key].library.visibility !==
        'PRIVATE'
    ) {
      return false;
    } else {
      return true;
    }
  };

  const isEditAllowed = (): boolean => {
    if (getScriptOutdatedState()) {
      return false;
    } else if (!librariesState.key) {
      return true;
    } else if (
      gameModel.type === 'SCENARIO' &&
      librariesState.libraries[librariesState.key].library.visibility !==
        'PRIVATE' &&
      librariesState.libraries[librariesState.key].library.visibility !==
        'INHERITED'
    ) {
      return false;
    } else {
      return true;
    }
  };

  React.useEffect(() => {
    // Loading libraries
    LibraryApi.getAllLibraries(gameModelId, props.scriptType)
      .then((libs: ILibraries) => {
        setLibrariesState((oldState: ILibrariesState) => {
          const libKeys = Object.keys(libs);
          const libKey =
            libKeys.length > 0 //If not, sets the new key as the first element in library
              ? libKeys[0]
              : ''; //If no more libraries, set key to ''
          let newLib: ILibrariesWithState = {};

          for (const key in libs) {
            newLib[key] = {
              library: libs[key],
              status: {
                isEdited: false,
                isOutdated: false,
                // isDeleted: false,
              },
            };
          }

          return {
            ...oldState,
            key: libKey,
            libraries: newLib,
          };
        });
      })
      .catch(_e => {
        alert('Cannot get the scripts');
      });
  }, [props.scriptType]);

  React.useEffect(() => {
    const globLibs = props.librariesState[props.scriptType] as Readonly<
      ILibraries
    >;
    if (globLibs) {
      Object.keys(globLibs).forEach(key => {
        const locLib = librariesState.libraries[key];
        const globLib = globLibs[key];
        if (locLib && locLib.library.version != globLib.version) {
          if (locLib.status.isEdited) {
            setLibraryOutdated(true, key);
          } else {
            updateOrCreateLibrary(key, globLib);
          }
        } else if (!locLib) {
          updateOrCreateLibrary(key, globLib);
        }
      });
    }
  }, [props.librariesState, props.scriptType]);

  return (
    <Toolbar>
      <Toolbar.Header>
        <IconButton
          icon="plus"
          tooltip="Add a new script"
          onClick={() => {
            if (!librariesState.key) {
              onSaveLibrary(); //Force save temporary content
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
            onClick={onSaveLibrary}
          />
        )}
        {isDeleteAllowed() && (
          <IconButton
            icon="trash"
            tooltip="Delete the script"
            onClick={onDeleteLibrary}
          />
        )}
        <div>
          {getScriptOutdatedState()
            ? 'The script is dangeroulsy outdated!'
            : getScriptEditingState()
            ? 'The script is not saved'
            : 'The script is saved'}
        </div>
      </Toolbar.Header>
      <Toolbar.Content>
        {getScriptOutdatedState() ? (
          <DiffEditor
            originalContent={
              props.librariesState[props.scriptType][librariesState.key].content
            }
            modifiedContent={
              librariesState.libraries[librariesState.key].library.content
            }
            language={scriptLanguage}
            onResolved={(content: string) => {
              onContentChange(content);
              onSaveLibrary();
            }}
          />
        ) : (
          <SrcEditor
            value={getActualScriptContent()}
            language={scriptLanguage}
            onBlur={onContentChange}
            readonly={!isEditAllowed()}
          />
        )}
      </Toolbar.Content>
    </Toolbar>
  );
}

export function ScriptEditorLayout(props: ScriptEditorLayoutProps) {
  return (
    <TabLayout tabs={['Styles', 'Client', 'Server']}>
      <ScriptEditor {...props} scriptType="CSS" />
      <ScriptEditor {...props} scriptType="ClientScript" />
      <ScriptEditor {...props} scriptType="ServerScript" />
    </TabLayout>
  );
}

export default function ConnectedPageDisplay() {
  return (
    <StoreConsumer selector={(s: State) => ({ librariesState: s.libraries })}>
      {({ state, dispatch }) => {
        return <ScriptEditorLayout {...state} dispatch={dispatch} />;
      }}
    </StoreConsumer>
  );
}
