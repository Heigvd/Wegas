import * as React from 'react';
import { FileAPI } from '../../../API/files.api';
import { GameModel } from '../../../data/selectors';
import { NativeTypes } from 'react-dnd-html5-backend';
import {
  hiddenFileBrowserStyle,
  DropTargetFileRow,
  DropTargetAddFileRow,
  DndFileRowProps,
  DndAddFileRowProps,
} from './FileBrowserRow';
import { DropTargetMonitor } from 'react-dnd';
import { defaultContextManager } from '../../../Components/DragAndDrop';
import { FontAwesome } from '../Views/FontAwesome';
import { omit } from 'lodash-es';
import { StoreConsumer, StoreDispatch } from '../../../data/store';
import { State } from '../../../data/Reducer/reducers';
import u from 'immer';
import {
  getAbsoluteFileName,
  generateGoodPath,
  isDirectory,
  editFileAction,
} from '../../../data/methods/ContentDescriptor';
import { Edition } from '../../../data/Reducer/globalState';

export interface MultiselectionFileBrowserProps {
  onSelectFiles?: (files: IFileMap) => void;
  selectedPaths?: string[];
}

export interface FileBrowserProps {
  onFileClick?: (files: IFile) => void;
  selectedFiles?: IFileMap;
  currentPath?: string;
}

interface CFileBrowserProps {
  dispatch: StoreDispatch;
  editing?: Readonly<Edition>;
}

export const gameModelDependsOnModel = () => {
  return (
    GameModel.selectCurrent().type === 'SCENARIO' &&
    GameModel.selectCurrent().basedOnId !== null
  );
};

export function FileBrowser(props: FileBrowserProps) {
  const [currentPath, setCurrentPath] = React.useState(
    props.currentPath ? props.currentPath : '/',
  );
  const [files, setFiles] = React.useState<IFile[]>([]);
  const [isUploading, setUploading] = React.useState(false);
  const [uploadAllowed, setUploadAllowed] = React.useState(true);

  const onSelect = (file: IFile) => {
    if (props.onFileClick) {
      props.onFileClick(file);
    }
  };

  const onOpen = (file: IFile) => {
    if (isDirectory(file)) {
      // Open directory
      setCurrentPath(generateGoodPath(file));
    } else {
      // Open file
      const win = window.open(
        FileAPI.fileURL(
          GameModel.selectCurrent().id!,
          getAbsoluteFileName(file),
        ),
        '_blank',
      );
      win!.focus();
    }
  };

  const onBack = () => {
    setCurrentPath(currentPath => {
      let newPath = currentPath.replace(/\/(?:.(?!\/))+$/, '');
      newPath = newPath === '' ? '/' : newPath;
      return newPath;
    });
  };

  const refreshFileList = () => {
    return FileAPI.getFileList(GameModel.selectCurrent().id!, currentPath).then(
      (res: IFile[]) => {
        setFiles(res);
      },
    );
  };

  const refresh = () => {
    // setRefreshToggle(refreshToggle => !refreshToggle);
    refreshFileList().then(() => {
      isUploadAllowed().then((allowed: boolean) => {
        setUploadAllowed(allowed);
      });
    });
  };

  const addNewDirectory = () => {
    const newDirName = prompt('Please enter the name of the new directory', '');
    FileAPI.createFile(
      GameModel.selectCurrent().id!,
      newDirName!,
      currentPath,
    ).then(() => {
      refresh();
    });
  };

  const clickNewFile = (event: React.MouseEvent) => {
    event.stopPropagation();
    document.getElementById('newfile-upload')!.click();
  };

  const uploadFiles = (files: FileList, path: string = currentPath) => {
    const finaly = (i: number) => {
      return (e?: any) => {
        if (e) {
          console.log(e);
        }
        if (i === files.length - 1) {
          // refresh(); // No need, as uploading is a state and will fire refresh event when changes
          setUploading(false);
        }
      };
    };
    setUploading(true);
    for (let i = 0; i < files.length; i += 1) {
      FileAPI.createFile(
        GameModel.selectCurrent().id!,
        files[i].name,
        path,
        files[i],
      ).then(finaly(i), finaly(i)); // Fires finaly when "then" and "catch" like a true "finally"
    }
  };

  const uploadFilesFromEvent = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files !== null) {
      uploadFiles(event.target.files);
    }
  };

  const isUploadAllowed = () => {
    return FileAPI.getFileMeta(GameModel.selectCurrent().id!, currentPath).then(
      (file: IFile) => {
        return (
          !gameModelDependsOnModel() ||
          file.visibility === 'PRIVATE' ||
          file.visibility === 'INHERITED'
        );
      },
    );
  };

  React.useEffect(() => {
    refresh();
  }, [currentPath, isUploading]);

  ///////////////////////////
  // Drag and drop management
  // Make sure you always set accept variable to avoid catching other DnD draggable objects
  const { FILE } = NativeTypes;
  const accepts = React.useMemo(() => [FILE], []); // Accept only files
  const handleFileDrop = (
    item: DndFileRowProps,
    monitor: DropTargetMonitor,
  ) => {
    if (monitor) {
      // If insertion in directory, open directory after upload
      if (item.file && isDirectory(item.file)) {
        uploadFiles(monitor.getItem().files, generateGoodPath(item.file));
        onOpen(item.file);
      } else {
        uploadFiles(monitor.getItem().files);
      }
    }
  };
  const handleAddFileDrop = (
    _item: DndAddFileRowProps,
    monitor: DropTargetMonitor,
  ) => {
    if (monitor) {
      uploadFiles(monitor.getItem().files);
    }
  };
  // Drag and drop management
  ///////////////////////////

  return (
    <div>
      <h2>{currentPath}</h2>
      {currentPath !== '/' && (
        <button onClick={onBack}>
          <FontAwesome icon="arrow-left" />
        </button>
      )}
      {uploadAllowed && (
        <button onClick={addNewDirectory}>
          <FontAwesome icon="folder-plus" />
        </button>
      )}
      <input
        id="newfile-upload"
        type="file"
        name="file"
        multiple={true}
        onChange={uploadFilesFromEvent}
        className={hiddenFileBrowserStyle}
      />
      <table>
        <tbody>
          {uploadAllowed && (
            <DropTargetAddFileRow
              accepts={accepts}
              onDrop={handleAddFileDrop}
              onClick={clickNewFile}
              isUploading={isUploading}
            />
          )}
          {/* {console.log(
            'render',
            currentPath,
            files,
            isUploading,
            selectedFiles,
            uploadAllowed,
          )} */}
          {files.map((file: IFile) => {
            return (
              <DropTargetFileRow
                key={generateGoodPath(file)}
                accepts={accepts}
                onDrop={handleFileDrop}
                file={file}
                onOpen={onOpen}
                onSelect={onSelect}
                callRefresh={refresh}
                selected={
                  props.selectedFiles &&
                  props.selectedFiles[generateGoodPath(file)] !== undefined
                }
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CFileBrowser(props: CFileBrowserProps) {
  const { editing, dispatch } = props;

  const [selectedFiles, setSelectedFiles] = React.useState<IFileMap>({});

  const onFileClick = async (file: IFile) => {
    dispatch(await editFileAction(file, dispatch));
  };

  React.useEffect(() => {
    if (editing && editing.type === 'File') {
      const newSF: IFileMap = {};
      newSF[generateGoodPath(editing.file)] = editing.file;
      setSelectedFiles(newSF);
    } else {
      setSelectedFiles({});
    }
  }, [editing]);

  return (
    <FileBrowser onFileClick={onFileClick} selectedFiles={selectedFiles} />
  );
}

export function ConnectedFileFileBrowser() {
  return (
    <StoreConsumer
      selector={(state: State) => {
        return {
          editing: state.global.editing,
        };
      }}
    >
      {({ state, dispatch }) => {
        return <CFileBrowser {...state} dispatch={dispatch} />;
      }}
    </StoreConsumer>
  );
}

export function MultiselectionFileFileBrowser(
  props: MultiselectionFileBrowserProps,
) {
  const [selectedFiles, setSelectedFiles] = React.useState<IFileMap>({});
  const [currentPath, setCurrentPath] = React.useState<string>('');

  const onFileClick = (file: IFile) => {
    setSelectedFiles(selectedFiles => {
      return u(selectedFiles, (selectedFiles: IFileMap) => {
        const key: string = generateGoodPath(file);
        const selected = selectedFiles[key];
        if (!selected) {
          selectedFiles[key] = file;
        } else {
          selectedFiles = omit(selectedFiles, key);
        }

        if (props.onSelectFiles) {
          props.onSelectFiles(selectedFiles);
        }

        return selectedFiles;
      });
    });
  };

  React.useEffect(() => {
    if (props.selectedPaths) {
      let newSelectedFiles: IFileMap = {};
      let highestPath: string = '';
      let shortestSplit: number = Number.MAX_SAFE_INTEGER;

      const requests = props.selectedPaths.map(item => {
        return new Promise(resolve => {
          FileAPI.getFileMeta(GameModel.selectCurrent().id!, item).then(
            (file: IFile) => {
              newSelectedFiles[item] = file;
              const splittedPath = file.path.split('/');
              if (splittedPath.length < shortestSplit) {
                shortestSplit = splittedPath.length;
                highestPath = file.path;
              }
              resolve();
            },
          );
        });
      });

      Promise.all(requests).then(() => {
        setCurrentPath(highestPath);
        setSelectedFiles(newSelectedFiles);
      });
    }
  }, [props.selectedPaths]);

  return (
    <FileBrowser
      {...props}
      onFileClick={onFileClick}
      selectedFiles={selectedFiles}
      currentPath={currentPath}
    />
  );
}

export const DndFileBrowser = defaultContextManager<
  React.ComponentType<FileBrowserProps>
>(FileBrowser);

export const DndMultipleFileBrowser = defaultContextManager<
  React.ComponentType<MultiselectionFileBrowserProps>
>(MultiselectionFileFileBrowser);

export const DndConnectedFileBrowser = defaultContextManager<
  React.ComponentType<FileBrowserProps>
>(ConnectedFileFileBrowser);
