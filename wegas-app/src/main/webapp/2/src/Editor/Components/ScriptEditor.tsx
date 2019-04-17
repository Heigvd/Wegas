import * as React from 'react';
import { TabLayout } from '../../Components/Tabs';
import { Toolbar } from '../../Components/Toolbar';
import { IconButton } from '../../Components/Button/IconButton';
import { Menu } from '../../Components/Menu';
import { LibraryApi, NewLibErrors } from '../../API/library.api';
import { GameModel } from '../../data/selectors';
import { Labeled } from './FormView/labeled';
import SrcEditor from './SrcEditor';

interface ScriptEditorProps {
  scriptType: 'CSS' | 'ClientScript' | 'ServerScript';
}

const visibilities: IVisibility[] = [
  'INTERNAL',
  'PROTECTED',
  'INHERITED',
  'PRIVATE',
];

interface ILibrariesState {
  key: string;
  libraries: ILibraries;
}

function ScriptEditor(props: ScriptEditorProps) {
  const gameModelId = GameModel.selectCurrent().id!;
  //   const libraries =

  const [librariesState, setLibrariesState] = React.useState<ILibrariesState>({
    key: '',
    libraries: {},
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

  const librarySelectorId = 'library-selector';
  const visibilitySelectorId = 'visibility-selector';

  const getLibrarySelector = () => {
    return document.getElementById(librarySelectorId)! as HTMLInputElement;
  };

  const getVisibilitySelector = () => {
    return document.getElementById(visibilitySelectorId)! as HTMLInputElement;
  };

  const loadLibraries = async (select?: string) => {
    LibraryApi.getAllLibraries(gameModelId, props.scriptType)
      .then((libs: ILibraries) => {
        setLibrariesState((oldState: ILibrariesState) => {
          const libKeys = Object.keys(libs);
          const libKey = select
            ? select
            : libKeys.indexOf(oldState.key) !== -1 //Checks if old key still exists in libs
            ? oldState.key
            : libKeys.length > 0 //If not, sets an empty key
            ? libKeys[0]
            : '';
          return {
            key: libKey,
            libraries: libs,
          };
        });
      })
      .catch(() => {
        alert('Impossible de récupérer les scripts');
      });
  };

  const onLibraryChange = () => {
    const libKey = getLibrarySelector().value;
    getVisibilitySelector().value = librariesState.libraries[libKey].visibility;
    setLibrariesState((oldState: ILibrariesState) => {
      return {
        key: libKey,
        libraries: oldState.libraries,
      };
    });
  };

  const onNewLibrary = (name: string | null) => {
    if (name !== null) {
      LibraryApi.newLibrary(gameModelId, props.scriptType, name)
        .then((res: IGameModel) => {
          loadLibraries(name);
        })
        .catch((e: NewLibErrors) => {
          switch (e) {
            case 'NOTNEW':
              alert('Ce fichier existe déja');
              break;
            case 'UNKNOWN':
            default:
              alert('Impossible de créer le script');
          }
        });
    }
  };

  const onSaveLibrary = () => {
    const libKey = librariesState.key;
    LibraryApi.saveLibrary(gameModelId, props.scriptType, libKey, {
      content: librariesState.libraries[librariesState.key].content,
      visibility: getVisibilitySelector().value as IVisibility,
      version: librariesState.libraries[libKey].version,
    })
      .then(() => {
        loadLibraries();
      })
      .catch(() => {
        alert('Impossible de sauver le script');
      });
  };

  const onDeleteLibrary = () => {
    LibraryApi.deleteLibrary(gameModelId, props.scriptType, librariesState.key)
      .then(() => {
        loadLibraries();
      })
      .catch(() => {
        alert('Impossible de supprimer le script');
      });
  };

  const onEditorBlur = (content: string) => {
    setLibrariesState((oldState: ILibrariesState) => {
      const newLibs = oldState.libraries;
      newLibs[oldState.key].content = content;
      return {
        key: oldState.key,
        libraries: newLibs,
      };
    });
  };

  React.useEffect(() => {
    loadLibraries();
  }, [props]);

  return (
    <Toolbar>
      <Toolbar.Header>
        <IconButton
          icon="plus"
          tooltip="Ajouter un nouveau script"
          onClick={() => onNewLibrary(prompt('Entrez le nom du script'))}
        />
        <select
          id={librarySelectorId}
          onChange={onLibraryChange}
          value={librariesState.key}
        >
          {Object.keys(librariesState.libraries).length > 0 ? (
            Object.keys(librariesState.libraries).map((key: string) => {
              return <option value={key}>{key}</option>;
            })
          ) : (
            <option value="">Aucun script</option>
          )}
        </select>
        <select id={visibilitySelectorId}>
          {visibilities.map((item, key) => {
            return <option value={item}>{item}</option>;
          })}
        </select>
        <IconButton
          icon="save"
          tooltip="Sauvegarder le script"
          onClick={onSaveLibrary}
        />
        <IconButton
          icon="trash"
          tooltip="Supprimer le script"
          onClick={onDeleteLibrary}
        />
      </Toolbar.Header>
      <Toolbar.Content>
        <SrcEditor
          value={
            librariesState.libraries[librariesState.key]
              ? librariesState.libraries[librariesState.key].content
              : ''
          }
          language={scriptLanguage}
          onBlur={onEditorBlur}
        />
      </Toolbar.Content>
    </Toolbar>
  );
}

export function ScriptEditorLayout() {
  return (
    <TabLayout tabs={['CSS', 'ClientScript', 'ServerScript']}>
      <ScriptEditor scriptType="CSS" />
      <ScriptEditor scriptType="ClientScript" />
      <ScriptEditor scriptType="ServerScript" />
    </TabLayout>
  );
}
