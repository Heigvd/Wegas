import * as React from 'react';
import {
  FileAPI,
  FILE_BASE,
  generateAbsolutePath,
} from '../../../../API/files.api';
import { GameModel } from '../../../../data/selectors';
import { IconButton } from '../../../../Components/Button/IconButton';
import { css, cx } from 'emotion';
import { DropTargetMonitor, DragObjectWithType, useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';
import { themeVar } from '../../../../Components/Theme';
import { FileBrowserNode } from './FileBrowserNode';
import { DefaultDndProvider } from '../../../../Components/DefaultDndProvider';
import { AsyncVariableForm } from '../../EntityEditor';
import getEditionConfig from '../../../editionConfig';
import { Schema } from 'jsoninput';
import { AvailableViews } from '../../FormView';
import { ReflexContainer, ReflexSplitter, ReflexElement } from 'react-reflex';

const grow = css({
  flex: '1 1 auto',
});
const flex = css({
  display: 'flex',
});
const fullWidth = css({
  width: '100%',
});
const hidden = css({
  display: 'none',
});

const highlight = css({
  backgroundColor: themeVar.searchColor,
});

export const dropZoneStyle = css({
  borderStyle: 'solid',
  borderWidth: '2px',
  borderColor: 'red',
});

export const isDirectory = (file: IFileDescriptor) =>
  file.mimeType === 'application/wfs-directory';

const getChildren = (
  directory: IFileDescriptor,
  fileState: FilesState,
): IFileDescriptor[] =>
  Object.values(fileState).reduce((children, file) => {
    const dirPath = generateAbsolutePath(directory);
    const filePath = generateAbsolutePath(file);
    if (dirPath !== filePath && dirPath === file.path) {
      return [...children, file];
    }
    return children;
  }, []);
/**
 * Returns url to read a file
 * @param absolutePath the absolute path of the file to read
 */
export const fileURL = (absolutePath: string) => {
  return (
    API_ENDPOINT +
    FILE_BASE(GameModel.selectCurrent().id!) +
    'read' +
    absolutePath
  );
};

const sortFiles = (a: IFileDescriptor, b: IFileDescriptor): number => {
  if (
    (isDirectory(a) && isDirectory(b)) ||
    (!isDirectory(a) && !isDirectory(b))
  ) {
    return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
  } else {
    return isDirectory(b) ? 1 : -1;
  }
};

export const gameModelDependsOnModel = () => {
  return (
    GameModel.selectCurrent().type === 'SCENARIO' &&
    GameModel.selectCurrent().basedOnId !== null
  );
};

export const isUploadAllowed = (file?: IFileDescriptor) => {
  return (
    file &&
    (!gameModelDependsOnModel() ||
      file.visibility === 'PRIVATE' ||
      file.visibility === 'INHERITED')
  );
};

type DropAction = (
  item: DragObjectWithType,
  monitor: DropTargetMonitor,
) => void;

export const dropSpecs = (action: DropAction) => ({
  accept: NativeTypes.FILE,
  canDrop: () => true,
  drop: action,
  collect: (mon: DropTargetMonitor) => {
    let canDrop: boolean;
    try {
      canDrop = !!mon.canDrop();
    } catch (_e) {
      //Do nothing (typically happens when you drag outside of the dropping zone too often)
      canDrop = false;
    }

    return {
      isOver: !!mon.isOver(),
      isShallowOver: !!mon.isOver({ shallow: true }),
      canDrop: canDrop,
    };
  },
});

interface UploadAction {
  type: 'Increment' | 'Decrement';
}

interface SetStateAction {
  type: 'SetState';
  state: FilesState;
}

interface InsertFileAction {
  type: 'InsertFile';
  file: IFileDescriptor;
}

interface RemoveFileAction {
  type: 'RemoveFile';
  file: IFileDescriptor;
}

type FileTreeStateActions =
  | SetStateAction
  | InsertFileAction
  | RemoveFileAction;

interface FilesState {
  [path: string]: IFileDescriptor;
}

const reduceFileState = (
  fileState: FilesState,
  action: FileTreeStateActions,
) => {
  switch (action.type) {
    case 'SetState': {
      return action.state;
    }
    case 'InsertFile': {
      return { ...fileState, [generateAbsolutePath(action.file)]: action.file };
    }
    case 'RemoveFile': {
      const removedFilePath = generateAbsolutePath(action.file);
      return Object.keys(fileState).reduce((newFileState, filePath) => {
        if (filePath.startsWith(removedFilePath)) {
          return newFileState;
        }
        return { ...newFileState, [filePath]: fileState[filePath] };
      }, {});
    }
  }
  return fileState;
};

type FileUpdateCallback = (newFile: IFileDescriptor) => void;

export interface FileBrowserProps {
  onFileClick?: (
    file: IFileDescriptor,
    onFileUpdate?: FileUpdateCallback,
  ) => void;
  onDelelteFile?: FileUpdateCallback;
  selectedFiles?: string[];
}

export function FileBrowser({
  onFileClick,
  onDelelteFile,
  selectedFiles,
}: FileBrowserProps) {
  const [fileState, dispatchFileStateAction] = React.useReducer(
    reduceFileState,
    {},
  );
  const uploader = React.useRef<HTMLInputElement>(null);

  const fileClick = React.useCallback(
    (file: IFileDescriptor) => {
      onFileClick &&
        onFileClick(file, updatedFile =>
          dispatchFileStateAction({
            type: 'InsertFile',
            file: updatedFile,
          }),
        );
    },
    [onFileClick],
  );

  const [nbUploadingFiles, dispatchUploadingFiles] = React.useReducer(
    (uploadCount: number, action: UploadAction) => {
      switch (action.type) {
        case 'Increment':
          return uploadCount + 1;
        case 'Decrement':
          return uploadCount - 1;
        default:
          return uploadCount;
      }
    },
    0,
  );

  const addNewDirectory = React.useCallback(
    async (parentDir: IFileDescriptor) => {
      const newDirName = prompt(
        'Please enter the name of the new directory',
        '',
      );
      if (newDirName) {
        return await FileAPI.createFile(
          newDirName,
          generateAbsolutePath(parentDir),
        )
          .then(file => {
            dispatchFileStateAction({
              type: 'InsertFile',
              file: file,
            });
            return true;
          })
          .catch(() => {
            return false;
          });
      }
      return false;
    },
    [],
  );

  const insertFile = React.useCallback(
    async (
      file: File,
      path: string = '',
      force: boolean = false,
      oldName?: string,
    ) => {
      const newFileName = oldName ? oldName : file.name;
      const newFile =
        fileState[generateAbsolutePath({ path, name: newFileName })];
      let forceUpload = oldName ? true : force;
      if (newFile) {
        if (
          forceUpload ||
          (!forceUpload &&
            confirm(
              `This file [${newFileName}] already exists, do you want to override it?`,
            ))
        ) {
          forceUpload = true;
          const newType = file.type;
          const oldType = newFile.mimeType;
          if (
            newType !== oldType &&
            !confirm(
              `You are about to change file type from [${oldType}] to [${newType}]. Are you sure?`,
            )
          ) {
            return false;
          }
        } else {
          return false;
        }
      }
      dispatchUploadingFiles({ type: 'Increment' });
      return FileAPI.createFile(newFileName, path, file, forceUpload)
        .then(file => {
          dispatchFileStateAction({
            type: 'InsertFile',
            file: file,
          });
          dispatchUploadingFiles({ type: 'Decrement' });
          fileClick(file);
          return true;
        })
        .catch(() => {
          dispatchUploadingFiles({ type: 'Decrement' });
          return false;
        });
    },
    [fileState, fileClick],
  );

  const insertFiles = React.useCallback(
    async (files: FileList, path?: string) => {
      let insertSuccess = false;
      for (let i = 0; i < files.length; ++i) {
        insertSuccess = insertSuccess || (await insertFile(files[i], path));
      }
      return insertSuccess;
    },
    [insertFile],
  );

  const uploadFiles = React.useCallback(
    (targetFile: IFileDescriptor) => async (
      event: React.ChangeEvent<HTMLInputElement>,
    ) => {
      const target = event.target;
      if (target && target.files && target.files.length > 0) {
        if (isDirectory(targetFile)) {
          return insertFiles(target.files, generateAbsolutePath(targetFile));
        } else {
          return insertFile(
            target.files[0],
            targetFile.path,
            true,
            targetFile.name,
          );
        }
      }
      return false;
    },
    [insertFiles, insertFile],
  );

  const addNewFile = React.useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    if (uploader.current) {
      uploader.current.click();
    }
  }, []);

  const deleteNode = React.useCallback(
    (file: IFileDescriptor) => {
      FileAPI.deleteFile(generateAbsolutePath(file)).then(() => {
        dispatchFileStateAction({
          type: 'RemoveFile',
          file: file,
        });
        onDelelteFile && onDelelteFile(file);
      });
    },
    [onDelelteFile],
  );

  const [dropZoneProps, dropZone] = useDrop(
    dropSpecs(item => {
      const { files } = (item as unknown) as {
        files: FileList;
        items: DataTransferItemList;
      };
      insertFiles(files);
    }),
  );

  const renderNode = (file: IFileDescriptor | null): JSX.Element => {
    if (file == null || fileState == null) {
      return <div>Empty...</div>;
    } else if (file.name === '' && file.path === '/') {
      return (
        <div className={grow}>
          {isDirectory(file) ? (
            getChildren(file, fileState)
              .sort(sortFiles)
              .map(file => renderNode(file))
          ) : (
            <div>Empty...</div>
          )}
        </div>
      );
    } else {
      const filePath = generateAbsolutePath(file);
      const children = getChildren(file, fileState);
      return (
        <FileBrowserNode
          key={filePath}
          file={file}
          onFileClick={fileClick}
          addNewDirectory={addNewDirectory}
          deleteFile={deleteNode}
          insertFiles={insertFiles}
          uploadFiles={uploadFiles}
          selected={selectedFiles && selectedFiles.includes(filePath)}
          defaultOpen={
            selectedFiles &&
            selectedFiles.some(selectedPath =>
              filePath.startsWith(selectedPath),
            )
          }
        >
          {isDirectory(file) &&
            (children.length > 0
              ? children.sort(sortFiles).map(file => renderNode(file))
              : 'Empty...')}
        </FileBrowserNode>
      );
    }
  };

  React.useEffect(() => {
    FileAPI.getFileMeta().then(rootFile => {
      FileAPI.getFileList('', true).then(files => {
        dispatchFileStateAction({
          type: 'SetState',
          state: [rootFile, ...files].reduce((newState: FilesState, file) => {
            return { ...newState, [generateAbsolutePath(file)]: file };
          }, {}),
        });
      });
    });
  }, []);

  return (
    <DefaultDndProvider>
      <div className={grow}>
        <div
          ref={dropZone}
          className={cx(fullWidth, {
            [hidden]: !dropZoneProps.canDrop,
            [highlight]: dropZoneProps.canDrop,
            [dropZoneStyle]: dropZoneProps.isShallowOver,
          })}
        >
          Drop file here
        </div>
        {fileState && nbUploadingFiles > 0 && (
          <div
            style={{
              backgroundColor: 'rgba(255, 0, 0, 0.2)',
              width: '100%',
            }}
          >
            Uploading {nbUploadingFiles} files
          </div>
        )}
        {fileState && (
          <div>
            <IconButton
              icon={'folder-plus'}
              tooltip={'Add new directory in root folder'}
              disabled={!isUploadAllowed(fileState['/'])}
              onClick={() => addNewDirectory(fileState['/'])}
              fixedWidth={true}
            />
            <IconButton
              icon={'file-upload'}
              tooltip={'Upload file in the folder'}
              disabled={!isUploadAllowed(fileState['/'])}
              onClick={addNewFile}
              fixedWidth={true}
            />
            <input
              ref={uploader}
              type="file"
              name="file"
              multiple={true}
              className={hidden}
              onChange={uploadFiles(fileState['/'])}
            />
            {renderNode(fileState['/'])}
          </div>
        )}
      </div>
    </DefaultDndProvider>
  );
}

export function FileBrowserWithMeta() {
  const [selectedFile, setSelectedFile] = React.useState<IFileDescriptor>();
  const fileUpdate = React.useRef<FileUpdateCallback>(() => {});

  const onFileClick = (
    file: IFileDescriptor,
    onFileUpdate?: FileUpdateCallback,
  ) => {
    setSelectedFile(oldSelectedFile => {
      if (
        !oldSelectedFile ||
        generateAbsolutePath(file) !== generateAbsolutePath(oldSelectedFile)
      ) {
        if (onFileUpdate) {
          fileUpdate.current = onFileUpdate;
        }
        return file;
      }
      return undefined;
    });
  };

  const saveMeta = (file: IFileDescriptor) => {
    FileAPI.updateMetadata(file).then((resFile: IFileDescriptor) => {
      fileUpdate.current(resFile);
      setSelectedFile(file);
    });
  };

  return (
    <div className={cx(flex, grow)}>
      <ReflexContainer orientation={'vertical'}>
        <ReflexElement>
          <FileBrowser
            onFileClick={onFileClick}
            onDelelteFile={() => setSelectedFile(undefined)}
            selectedFiles={
              selectedFile ? [generateAbsolutePath(selectedFile)] : []
            }
          />
        </ReflexElement>
        {selectedFile && <ReflexSplitter />}
        {selectedFile && (
          <ReflexElement>
            <div className={cx(flex, grow)}>
              <AsyncVariableForm
                getConfig={entity =>
                  getEditionConfig(entity) as Promise<Schema<AvailableViews>>
                }
                update={saveMeta}
                entity={selectedFile}
              />
            </div>
          </ReflexElement>
        )}
      </ReflexContainer>
    </div>
  );
}
