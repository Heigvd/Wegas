import * as React from 'react';
import { FileAPI } from '../../../../API/files.api';
import { GameModel } from '../../../../data/selectors';
import u from 'immer';
import { IconButton } from '../../../../Components/Button/IconButton';
import {
  getAbsoluteFileName,
  isDirectory,
  editFileAction,
  generateGoodPath,
  generateAbsolutePath,
  TMap,
} from '../../../../data/methods/ContentDescriptor';
import { css, cx } from 'emotion';
import { StoreDispatch, StoreConsumer } from '../../../../data/store';
import { Edition, closeEditor } from '../../../../data/Reducer/globalState';
import { State } from '../../../../data/Reducer/reducers';
import { DropTargetMonitor, DragObjectWithType, useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';
import { themeVar } from '../../../../Components/Theme';
import { omit } from 'lodash';
import { FileNode, isNodeDirectory, FileBrowserNode } from './FileBrowserNode';
import { DefaultDndProvider } from '../../../../Components/DefaultDndProvider';

const grow = css({
  flex: '1 1 auto',
});

export const hiddenFileBrowserStyle = css({
  display: 'none',
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

type IFileMap = TMap<IFileDescriptor>;

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

interface StateAction {
  type: string;
}

interface UploadAction extends StateAction {
  type: 'IncrementUpload' | 'DecrementUpload';
}

interface SetStateAction extends StateAction {
  type: 'SetState';
  state: FileTreeState;
}

interface InsertFileAction extends StateAction {
  type: 'InsertFile';
  file: IFileDescriptor;
  openPath?: boolean;
}

interface UpdateFileAction extends StateAction {
  type: 'UpdateFile';
  file: IFileDescriptor;
  openPath?: boolean;
}

interface RemoveFileAction extends StateAction {
  type: 'RemoveFile';
  node: FileNode;
}

interface SimpleActions extends StateAction {
  type: 'OpenFolder' | 'SelectFile';
  nodeId: string;
  action: boolean;
}

type FileTreeStateActions =
  | SetStateAction
  | SimpleActions
  | UploadAction
  | InsertFileAction
  | RemoveFileAction
  | UpdateFileAction;

interface FileTable {
  [key: string]: FileNode;
}

interface FileTreeState {
  rootNode: string;
  nodes: FileTable;
  nbUploadingFiles: number;
}

const setNodeTree: (
  fileState: FileTreeState | null,
  action: FileTreeStateActions,
) => FileTreeState | null = (fileState, action) => {
  return u(fileState, fileState => {
    if (fileState === null || action.type === 'SetState') {
      if (action.type === 'SetState') {
        fileState = action.state;
      }
    } else {
      switch (action.type) {
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
        case 'IncrementUpload': {
          fileState.nbUploadingFiles += 1;
          break;
        }
        case 'DecrementUpload': {
          if (fileState.nbUploadingFiles > 0) {
            fileState.nbUploadingFiles -= 1;
          }
          break;
        }
        case 'InsertFile': {
          if (
            fileState.nodes[action.file.path] &&
            fileState.nodes[action.file.path].childrenIds
          ) {
            const absoluteFileName = getAbsoluteFileName(action.file);
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
          fileState.nodes[getAbsoluteFileName(action.file)].file = action.file;
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
                  id => id !== getAbsoluteFileName(targetNode.file),
                );
              }
              if (key === getAbsoluteFileName(action.node.file)) {
                fileNodes = omit(fileNodes, key);
                fileNodes = recurseRemove(fileNodes, targetNode);
              }
            }
            return fileNodes;
          };

          fileState.nodes = recurseRemove(fileState.nodes, action.node);
        }
      }
    }
    return fileState;
  });
};

export interface FileBrowserProps {
  onFileClick?: (files: IFileDescriptor | null) => void;
  selectedFiles?: IFileMap;
}

export function FileBrowser({ onFileClick, selectedFiles }: FileBrowserProps) {
  const [fileState, dispatchFileStateAction] = React.useReducer(
    setNodeTree,
    null,
  );
  const uploader = React.useRef<HTMLInputElement>(null);

  const selectFile = React.useCallback(
    (node: FileNode) => {
      if (onFileClick) {
        onFileClick(node.file);
      }
    },
    [onFileClick],
  );

  const addNewDirectory = React.useCallback((parentDir: IFileDescriptor) => {
    const newDirName = prompt('Please enter the name of the new directory', '');
    if (newDirName !== null) {
      FileAPI.createFile(newDirName, getAbsoluteFileName(parentDir)).then(
        file =>
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
        fileState &&
        fileState.nodes[generateAbsolutePath(path, newFileName)] !== undefined
      ) {
        if (
          forceUpload ||
          (!forceUpload &&
            confirm(
              'This file [' +
                newFileName +
                '] already exists, do you want to override it?',
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
              'You are about to change file type from [' +
                oldType +
                '] to [' +
                newType +
                ']. Are you sure?',
            )
          ) {
            return;
          }
        } else {
          return;
        }
      }
      dispatchFileStateAction({ type: 'IncrementUpload' });
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
          dispatchFileStateAction({ type: 'DecrementUpload' });
          onFileClick && onFileClick(file);
        })
        .catch(() => {
          dispatchFileStateAction({ type: 'DecrementUpload' });
        });
    },
    [fileState, onFileClick],
  );

  const insertFiles = React.useCallback(
    (files: FileList, path?: string) => {
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
          insertFiles(target.files, getAbsoluteFileName(targetNode.file));
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
      FileAPI.deleteFile(getAbsoluteFileName(node.file)).then(() => {
        dispatchFileStateAction({
          type: 'RemoveFile',
          node: node,
        });
        onFileClick && onFileClick(null);
      });
    },
    [onFileClick],
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

  type RenderNodeType = (node: FileNode | null) => JSX.Element;

  const renderNode: RenderNodeType = React.useCallback(
    node => {
      if (node === null || fileState === null) {
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
            key={getAbsoluteFileName(node.file)}
            node={node}
            selectFile={selectFile}
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
    },
    [
      addNewDirectory,
      deleteNode,
      insertFiles,
      fileState,
      selectFile,
      uploadFiles,
    ],
  );

  React.useEffect(() => {
    FileAPI.getFileMeta().then(rootFile => {
      FileAPI.getFileList('', true).then(files => {
        const newFileState: FileTreeState = {
          rootNode: getAbsoluteFileName(rootFile),
          nodes: {},
          nbUploadingFiles: 0,
        };
        newFileState.nodes[getAbsoluteFileName(rootFile)] = {
          file: rootFile,
          childrenIds: [],
          open: true,
        };
        for (const file of files) {
          newFileState.nodes[getAbsoluteFileName(file)] = isDirectory(file)
            ? {
                file: file,
                childrenIds: [],
                open: false,
                selected: false,
              }
            : { file: file };
          newFileState.nodes[file.path].childrenIds!.push(
            getAbsoluteFileName(file),
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
        if (
          Object.keys(selectedFiles).find(selKey =>
            selKey.startsWith(
              getAbsoluteFileName(fileState.nodes[fileKey].file),
            ),
          ) !== undefined
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
          action:
            Object.keys(selectedFiles).indexOf(
              getAbsoluteFileName(fileState.nodes[fileKey].file),
            ) >= 0,
        });
      });
    }
  }, [selectedFiles, fileState]);

  return (
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
      {fileState && fileState.nbUploadingFiles > 0 && (
        <div
          style={{
            backgroundColor: 'rgba(255, 0, 0, 0.2)',
            width: '100%',
          }}
        >
          Uploading {fileState.nbUploadingFiles} files
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
            className={hiddenFileBrowserStyle}
            onChange={uploadFiles(fileState.nodes[fileState.rootNode])}
          />
          {renderNode(fileState.nodes[fileState.rootNode])}
        </div>
      )}
    </div>
  );
}

interface CFileBrowserProps {
  dispatch: StoreDispatch;
  editing?: Readonly<Edition>;
}

function CFileBrowser(props: CFileBrowserProps) {
  const { editing, dispatch } = props;

  const [selectedFiles, setSelectedFiles] = React.useState<IFileMap>({});

  const onFileClick = React.useCallback(
    (file: IFileDescriptor | null) => {
      if (file === null) {
        dispatch(closeEditor());
      } else {
        dispatch(editFileAction(file, dispatch));
      }
    },
    [dispatch],
  );

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

export function ConnectedFileBrowser() {
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

export function DndConnectedFileBrowser() {
  return (
    <DefaultDndProvider>
      <ConnectedFileBrowser />
    </DefaultDndProvider>
  );
}
