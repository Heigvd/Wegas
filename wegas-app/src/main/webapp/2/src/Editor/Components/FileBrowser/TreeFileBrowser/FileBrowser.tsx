import * as React from 'react';
import { FileAPI, FILE_BASE } from '../../../../API/files.api';
import { GameModel } from '../../../../data/selectors';
import u from 'immer';
import { IconButton } from '../../../../Components/Button/IconButton';
import { css, cx } from 'emotion';
import { DropTargetMonitor, DragObjectWithType, useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';
import { themeVar } from '../../../../Components/Theme';
import { omit } from 'lodash';
import { FileNode, isNodeDirectory, FileBrowserNode } from './FileBrowserNode';
import { DefaultDndProvider } from '../../../../Components/DefaultDndProvider';
import { AsyncVariableForm } from '../../EntityEditor';
import getEditionConfig from '../../../editionConfig';
import { Schema } from 'jsoninput';
import { AvailableViews } from '../../FormView';
import { node } from 'prop-types';
import { wlog } from '../../../../Helper/wegaslog';

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

const generateAbsolutePath = (path: string, filename: string) => {
  return path.replace(/(\/)$/, '') + '/' + filename;
};

export const generateGoodPath = (file: IFileDescriptor) => {
  return generateAbsolutePath(file.path, file.name);
};

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

export const gameModelDependsOnModel = () => {
  return (
    GameModel.selectCurrent().type === 'SCENARIO' &&
    GameModel.selectCurrent().basedOnId !== null
  );
};

export const isUploadAllowed = (node: FileNode) => {
  return (
    !gameModelDependsOnModel() ||
    node.file.visibility === 'PRIVATE' ||
    node.file.visibility === 'INHERITED'
  );
};

const accept = NativeTypes.FILE;

type DropAction = (
  item: DragObjectWithType,
  monitor: DropTargetMonitor,
) => void;

export const dropSpecs = (action: DropAction) => ({
  accept: accept,
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
  state: FileTreeState;
}

interface InsertFileAction {
  type: 'InsertFile';
  file: IFileDescriptor;
  openPath?: boolean;
}

interface UpdateFileAction {
  type: 'UpdateFile';
  file: IFileDescriptor;
  openPath?: boolean;
}

interface RemoveFileAction {
  type: 'RemoveFile';
  node: FileNode;
}

interface SimpleActions {
  type: 'OpenFolder' | 'SelectFile';
  nodeId: string;
  action: boolean;
}

type FileTreeStateActions =
  | SetStateAction
  | SimpleActions
  | InsertFileAction
  | RemoveFileAction
  | UpdateFileAction;

interface FileTable {
  [key: string]: FileNode;
}

interface FileTreeState {
  rootNode: string;
  nodes: FileTable;
}

const setNodeTree = u(
  (fileState: FileTreeState, action: FileTreeStateActions) => {
    switch (action.type) {
      case 'SetState': {
        fileState = action.state;
        break;
      }
      case 'OpenFolder': {
        if (fileState.nodes[action.nodeId]) {
          fileState.nodes[action.nodeId].open = action.action;
        }
        break;
      }
      case 'SelectFile': {
        if (fileState.nodes[action.nodeId]) {
          fileState.nodes[action.nodeId].selected = action.action;
        }
        break;
      }
      case 'InsertFile': {
        if (
          fileState.nodes[action.file.path] &&
          fileState.nodes[action.file.path].childrenIds
        ) {
          const absoluteFileName = generateGoodPath(action.file);
          //Needs to be inserted at the good index in order to keep the sort
          const insertionIndex = fileState.nodes[
            action.file.path
          ].childrenIds!.findIndex(
            id =>
              (isDirectory(action.file) ||
                (fileState !== null &&
                  fileState.nodes[id] !== undefined &&
                  !isDirectory(fileState.nodes[id].file))) &&
              id > absoluteFileName,
          );
          fileState.nodes[action.file.path].childrenIds!.splice(
            insertionIndex,
            0,
            absoluteFileName,
          );
          fileState.nodes[action.file.path].open = action.openPath;
          fileState.nodes[absoluteFileName] = {
            file: action.file,
            childrenIds: isDirectory(action.file) ? [] : undefined,
          };
        }
        break;
      }
      case 'UpdateFile': {
        fileState.nodes[generateGoodPath(action.file)].file = action.file;
        if (action.openPath && fileState.nodes[action.file.path]) {
          fileState.nodes[action.file.path].open = true;
        }
        break;
      }
      case 'RemoveFile': {
        const recurseRemove: (
          fileNodes: FileTable,
          targetNode: FileNode,
        ) => FileTable = (fileNodes, targetNode) => {
          for (const key in fileNodes) {
            if (isNodeDirectory(fileNodes[targetNode.file.path])) {
              fileNodes[targetNode.file.path].childrenIds = fileNodes[
                targetNode.file.path
              ].childrenIds!.filter(
                id => id !== generateGoodPath(targetNode.file),
              );
            }
            if (key === generateGoodPath(action.node.file)) {
              fileNodes = omit(fileNodes, key);
              fileNodes = recurseRemove(fileNodes, targetNode);
            }
          }
          return fileNodes;
        };
        fileState.nodes = recurseRemove(fileState.nodes, action.node);
      }
    }
    return fileState;
  },
);

type FileUpdateCallback = (newFile: IFileDescriptor) => void;

export interface FileBrowserProps {
  onFileClick?: (
    file: IFileDescriptor,
    onFileUpdate?: FileUpdateCallback,
  ) => void;
  onDelelteFile?: (file: IFileDescriptor | null) => void;
  selectedFiles?: string[];
}

export function FileBrowser({
  onFileClick,
  selectedFiles,
  onDelelteFile,
}: FileBrowserProps) {
  const [fileState, dispatchFileStateAction] = React.useReducer(setNodeTree, {
    rootNode: '',
    nodes: {},
  });
  const uploader = React.useRef<HTMLInputElement>(null);

  const selectFile = React.useCallback(
    (node: FileNode) => {
      if (onFileClick) {
        onFileClick(node.file, updatedFile =>
          // Allows catching the anwser of the saved event and update filebrowser data
          dispatchFileStateAction({
            type: 'UpdateFile',
            file: updatedFile,
            openPath: true,
          }),
        );
      }
    },
    [onFileClick],
  );

  const [nbUploadingFiles, dispatchUploadingFiles] = React.useReducer(
    u(
      (uploadCount: number, action: UploadAction) =>
        uploadCount + (action.type === 'Increment' ? 1 : -1),
    ),
    0,
  );

  const addNewDirectory = React.useCallback((parentDir: IFileDescriptor) => {
    const newDirName = prompt('Please enter the name of the new directory', '');
    if (newDirName !== null) {
      FileAPI.createFile(newDirName, generateGoodPath(parentDir)).then(file =>
        dispatchFileStateAction({
          type: 'InsertFile',
          file: file,
          openPath: true,
        }),
      );
    }
  }, []);

  const insertFile = React.useCallback(
    (
      file: File,
      path: string = '',
      force: boolean = false,
      oldName?: string,
    ) => {
      const newFileName = oldName ? oldName : file.name;
      let forceUpload = oldName ? true : force;
      if (
        fileState.nodes[generateAbsolutePath(path, newFileName)] !== undefined
      ) {
        if (
          forceUpload ||
          (!forceUpload &&
            confirm(
              `This file [${newFileName}] already exists, do you want to override it?`,
            ))
        ) {
          forceUpload = true;
          const newType = file.type;
          const oldType =
            fileState.nodes[generateAbsolutePath(path, newFileName)].file
              .mimeType;
          if (
            newType !== oldType &&
            !confirm(
              `You are about to change file type from [${oldType}] to [${newType}]. Are you sure?`,
            )
          ) {
            return;
          }
        } else {
          return;
        }
      }
      dispatchUploadingFiles({ type: 'Increment' });
      FileAPI.createFile(newFileName, path, file, forceUpload)
        .then(file => {
          if (forceUpload) {
            dispatchFileStateAction({
              type: 'UpdateFile',
              file: file,
              openPath: true,
            });
          } else {
            dispatchFileStateAction({
              type: 'InsertFile',
              file: file,
              openPath: true,
            });
          }
          dispatchUploadingFiles({ type: 'Decrement' });
          selectFile({ ...node, file: file });
        })
        .catch(() => {
          dispatchUploadingFiles({ type: 'Decrement' });
        });
    },
    [fileState, selectFile],
  );

  const insertFiles = React.useCallback(
    (files: FileList, path?: string) => {
      wlog('insert files');
      for (let i = 0; i < files.length; i += 1) {
        insertFile(files[i], path);
      }
    },
    [insertFile],
  );

  const uploadFiles = React.useCallback(
    (targetNode: FileNode) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const target = event.target;
      if (target && target.files && target.files.length > 0) {
        if (isNodeDirectory(targetNode)) {
          insertFiles(target.files, generateGoodPath(targetNode.file));
        } else {
          insertFile(
            target.files[0],
            targetNode.file.path,
            true,
            targetNode.file.name,
          );
        }
      }
    },
    [insertFiles, insertFile],
  );

  const addNewFile = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (uploader.current) {
      uploader.current.click();
    }
  };

  const deleteNode = React.useCallback(
    (node: FileNode) => {
      FileAPI.deleteFile(generateGoodPath(node.file)).then(() => {
        dispatchFileStateAction({
          type: 'RemoveFile',
          node: node,
        });
        onDelelteFile && onDelelteFile(node.file);
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

  const renderNode = (node: FileNode | null): JSX.Element => {
    if (node == null || fileState == null) {
      return <div>Empty...</div>;
    } else if (node.file.name === '' && node.file.path === '/') {
      return (
        <div className={grow}>
          {isNodeDirectory(node) ? (
            node.childrenIds.map((nodeKey: string) =>
              renderNode(fileState.nodes[nodeKey]),
            )
          ) : (
            <div>Empty...</div>
          )}
        </div>
      );
    } else {
      return (
        <FileBrowserNode
          key={generateGoodPath(node.file)}
          node={node}
          onSelectFile={selectFile}
          onOpen={(node, open) =>
            dispatchFileStateAction({
              type: 'OpenFolder',
              action: open,
              nodeId: generateGoodPath(node.file),
            })
          }
          addNewDirectory={addNewDirectory}
          deleteFile={deleteNode}
          insertFiles={insertFiles}
          uploadFiles={uploadFiles}
        >
          {isNodeDirectory(node) &&
            (node.childrenIds.length > 0
              ? node.childrenIds.map(id => renderNode(fileState.nodes[id]))
              : 'Empty...')}
        </FileBrowserNode>
      );
    }
  };

  React.useEffect(() => {
    FileAPI.getFileMeta().then(rootFile => {
      FileAPI.getFileList('', true).then(files => {
        const newFileState: FileTreeState = {
          rootNode: generateGoodPath(rootFile),
          nodes: {},
        };
        newFileState.nodes[generateGoodPath(rootFile)] = {
          file: rootFile,
          childrenIds: [],
          open: true,
        };
        for (const file of files) {
          newFileState.nodes[generateGoodPath(file)] = isDirectory(file)
            ? {
                file: file,
                childrenIds: [],
                open: false,
                selected: false,
              }
            : { file: file };
          newFileState.nodes[file.path].childrenIds!.push(
            generateGoodPath(file),
          );
        }

        dispatchFileStateAction({
          type: 'SetState',
          state: newFileState,
        });
      });
    });
  }, []);

  React.useEffect(() => {
    if (fileState && selectedFiles) {
      Object.keys(fileState.nodes).map(fileKey => {
        const fileNode = fileState.nodes[fileKey];
        const filePath = generateGoodPath(fileNode.file);
        if (
          selectedFiles.find(selKey => selKey.startsWith(filePath)) !==
          undefined
        ) {
          dispatchFileStateAction({
            type: 'OpenFolder',
            nodeId: fileKey,
            action: true,
          });
        }
        dispatchFileStateAction({
          type: 'SelectFile',
          nodeId: fileKey,
          action: selectedFiles.includes(filePath),
        });
      });
    }
    // We only want selectedFiles to trigger this effect
    // avoid keeping the folder open when a file is selected and the user stills want to close the folder
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFiles]);

  return (
    <DefaultDndProvider>
      <div className={grow}>
        <div
          ref={dropZone}
          className={cx(
            fullWidth,
            !dropZoneProps.canDrop ? hidden : highlight,
            dropZoneProps.isShallowOver ? dropZoneStyle : '',
          )}
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
              disabled={!isUploadAllowed(fileState.nodes[fileState.rootNode])}
              onClick={() =>
                addNewDirectory(fileState.nodes[fileState.rootNode].file)
              }
              fixedWidth={true}
            />
            <IconButton
              icon={'file-upload'}
              tooltip={'Upload file in the folder'}
              disabled={!isUploadAllowed(fileState.nodes[fileState.rootNode])}
              onClick={addNewFile}
              fixedWidth={true}
            />
            <input
              ref={uploader}
              type="file"
              name="file"
              multiple={true}
              className={hidden}
              onChange={uploadFiles(fileState.nodes[fileState.rootNode])}
            />
            {renderNode(fileState.nodes[fileState.rootNode])}
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
        generateGoodPath(file) !== generateGoodPath(oldSelectedFile)
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
      <FileBrowser
        onFileClick={onFileClick}
        onDelelteFile={() => setSelectedFile(undefined)}
        selectedFiles={selectedFile ? [generateGoodPath(selectedFile)] : []}
      />
      {selectedFile && (
        <div className={cx(flex, grow)}>
          <AsyncVariableForm
            getConfig={entity =>
              getEditionConfig(entity) as Promise<Schema<AvailableViews>>
            }
            update={saveMeta}
            entity={selectedFile}
          />
        </div>
      )}
    </div>
  );
}
