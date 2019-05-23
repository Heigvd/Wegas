import * as React from 'react';
import { FileAPI } from '../../../API/files.api';
import { GameModel } from '../../../data/selectors';
import u from 'immer';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { IconButton } from '../../../Components/Button/IconButton';
import {
  getAbsoluteFileName,
  isDirectory,
  editFileAction,
  generateGoodPath,
} from '../../../data/methods/ContentDescriptor';
import { css, cx } from 'emotion';
import { StoreDispatch, StoreConsumer } from '../../../data/store';
import { Edition } from '../../../data/Reducer/globalState';
import { State } from '../../../data/Reducer/reducers';
import {
  __EXPERIMENTAL_DND_HOOKS_THAT_MAY_CHANGE_AND_BREAK_MY_BUILD__ as dnd,
  DropTargetMonitor,
  DragObjectWithType,
} from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';
import { defaultContextManager } from '../../../Components/DragAndDrop';
import { themeVar } from '../../../Components/Theme';
import { useDrag } from 'react-dnd/lib/cjs/hooks';

const hiddenFileBrowserStyle = css({
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

const hoverRow = css({
  ':hover': {
    backgroundColor: themeVar.primaryHoverColor,
  },
});

const dropZoneStyle = css({
  borderStyle: 'solid',
  borderWidth: '2px',
  borderColor: 'red',
});

export const gameModelDependsOnModel = () => {
  return (
    GameModel.selectCurrent().type === 'SCENARIO' &&
    GameModel.selectCurrent().basedOnId !== null
  );
};

const isUploadAllowed = (file: IFile) => {
  return (
    !gameModelDependsOnModel() ||
    file.visibility === 'PRIVATE' ||
    file.visibility === 'INHERITED'
  );
};

const getIconForFileType = (fileType: string): IconProp => {
  if (fileType.indexOf('directory') !== -1) {
    return 'folder';
  } else if (fileType.indexOf('audio/') !== -1) {
    return 'file-audio';
  } else if (fileType.indexOf('video/') !== -1) {
    return 'file-video';
  } else if (fileType.indexOf('image/') !== -1) {
    return 'file-image';
  } else {
    return 'file';
  }
};

const accept = NativeTypes.FILE;

type DropAction = (
  item: DragObjectWithType,
  monitor: DropTargetMonitor,
) => void;

const dropSpecs = (action: DropAction) => ({
  accept: accept,
  canDrop: () => true,
  drop: action,
  collect: (mon: DropTargetMonitor) => {
    let canDrop = false;
    try {
      canDrop = !!mon.canDrop();
    } catch (_e) {
      //Do nothing (typically happens when you drag outside of the dropping zone too often)
    }

    return {
      isOver: !!mon.isOver(),
      isShallowOver: !!mon.isOver({ shallow: true }),
      canDrop: canDrop,
    };
  },
});

interface FileBrowserNodeProps {
  node: FileNode;
  openFolder: (file: IFile) => void;
  closeFolder: (file: IFile) => void;
  selectFile: (file: IFile) => void;
  addNewDirectory: (file: IFile) => void;
  addNewFile: (
    uploader: HTMLInputElement | null,
  ) => (event: React.MouseEvent) => void;
  deleteFile: (baseDir: IFile) => (event: React.MouseEvent) => void;
  insertFiles: (files: FileList, baseDir?: IFile) => void;
  uploadFiles: (
    parentDir: IFile,
  ) => (event: React.ChangeEvent<HTMLInputElement>) => void;
}

function FileBrowserNode(props: FileBrowserNodeProps) {
  const {
    node,
    openFolder,
    closeFolder,
    selectFile,
    addNewDirectory,
    addNewFile,
    deleteFile,
    insertFiles,
    uploadFiles,
  } = props;

  const uploader = React.useRef<HTMLInputElement>(null);

  const openFile = (file: IFile) => {
    const win = window.open(
      FileAPI.fileURL(GameModel.selectCurrent().id!, getAbsoluteFileName(file)),
      '_blank',
    );
    win!.focus();
  };

  const [dropZoneProps, dropZone] = dnd.useDrop(
    dropSpecs(item => {
      const { files } = (item as unknown) as {
        files: FileList;
        items: DataTransferItemList;
      };
      insertFiles(files, node.file);
    }),
  );

  const timeoutBeforeExpend = 1000;

  React.useEffect(() => {
    let openTimeout: number | undefined;
    if (isDirectory(node.file)) {
      if (dropZoneProps.isShallowOver && dropZoneProps.canDrop) {
        openTimeout = (setTimeout(
          () => openFolder(node.file),
          timeoutBeforeExpend,
        ) as unknown) as number;
      }
      return () => {
        clearTimeout(openTimeout);
        // if (!dropZoneProps.isOver && dropZoneProps.canDrop) {
        //   closeFolder(node.file);
        // }
      };
    }
  }, [dropZoneProps, node.file, openFolder]);

  return (
    <div style={{ display: 'flex' }}>
      <input
        ref={uploader}
        type="file"
        name="file"
        multiple={true}
        className={hiddenFileBrowserStyle}
        onChange={uploadFiles(node.file)}
      />

      {isDirectory(node.file) && (
        <IconButton
          icon={node.children.length > 0 ? 'caret-down' : 'caret-right'}
          onClick={() => {
            if (node.children.length > 0) {
              closeFolder(node.file);
            } else {
              openFolder(node.file);
            }
          }}
          className={css({ float: 'left', height: 'fit-content' })}
        />
      )}
      <div style={{ flex: '1 1 auto' }}>
        <div
          ref={dropZone}
          className={cx(
            isDirectory(node.file) && dropZoneProps.isShallowOver
              ? dropZoneStyle
              : '',
            hoverRow,
          )}
        >
          <IconButton
            icon={getIconForFileType(node.file.mimeType)}
            onClick={() => selectFile(node.file)}
          />
          {node.file.name}
          <span style={{ float: 'right' }}>
            {isDirectory(node.file) ? (
              <>
                <IconButton
                  icon={'folder-plus'}
                  tooltip={'Add new directory in folder'}
                  disabled={!isUploadAllowed(node.file)}
                  onClick={() => addNewDirectory(node.file)}
                />
                <IconButton
                  icon={'file-upload'}
                  tooltip={'Upload file in the folder'}
                  disabled={!isUploadAllowed(node.file)}
                  onClick={addNewFile(uploader.current)}
                />
              </>
            ) : (
              <>
                <IconButton
                  icon={'external-link-alt'}
                  tooltip={'Open file'}
                  onClick={() => openFile(node.file)}
                />
                <IconButton
                  icon={'file-import'}
                  tooltip={'Upload new version'}
                  disabled={!isUploadAllowed(node.file)}
                  onClick={addNewFile(uploader.current)}
                />
              </>
            )}

            <IconButton
              icon={'trash'}
              tooltip={'Delete'}
              onClick={deleteFile(node.file)}
            />
          </span>
        </div>
        {isDirectory(node.file) && node.children.length > 0 && (
          <div>
            {node.children.map((node: FileNode | null) => {
              if (node !== null) {
                return (
                  <FileBrowserNode
                    {...props}
                    node={node}
                    key={getAbsoluteFileName(node.file)}
                  />
                );
              } else {
                return <div>Empty...</div>;
              }
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface FileNode {
  file: IFile;
  children: (FileNode | null)[];
}

interface FileNodeAction {
  type: string;
}

interface NodeAction extends FileNodeAction {
  type: 'OpenFolder' | 'CloseFolder' | 'RemoveFile';
  node: FileNode;
}

type FileMapAction = NodeAction;

const findFile = (
  rootNode: FileNode,
  node: FileNode,
  callback: (parentNode: FileNode, index: number) => FileNode,
) => {
  for (let index = 0; index < rootNode.children.length; index += 1) {
    const children = rootNode.children[index];
    if (children !== null) {
      if (
        getAbsoluteFileName(children.file) === getAbsoluteFileName(node.file)
      ) {
        return callback(rootNode, index);
      } else if (isDirectory(children.file)) {
        rootNode.children[index] = findFile(children, node, callback);
      }
    }
  }
  return rootNode;
};

const setNodeTree: (
  rootNode: FileNode | null,
  action: FileMapAction,
) => FileNode | null = (rootNode, action) => {
  return u(rootNode, rootNode => {
    if (
      rootNode === null ||
      (action.node.file.name === '' && action.node.file.path === '/')
    ) {
      rootNode = action.node;
    } else {
      switch (action.type) {
        case 'CloseFolder':
        case 'OpenFolder': {
          rootNode = findFile(
            rootNode,
            action.node,
            (parentNode: FileNode, index: number) => {
              const children = parentNode.children[index];
              if (action.type === 'OpenFolder') {
                parentNode.children[index] = action.node;
              } else if (children !== null) {
                children.children = [];
              }
              return parentNode;
            },
          );
          break;
        }
        case 'RemoveFile': {
          rootNode = findFile(
            rootNode,
            action.node,
            (parentNode: FileNode, index: number) => {
              parentNode.children.splice(index, 1);
              return parentNode;
            },
          );
          break;
        }
      }
    }
    return rootNode;
  });
};

export interface FileBrowserProps {
  onFileClick?: (files: IFile) => void;
  selectedFiles?: IFileMap;
}

export function FileBrowser(props: FileBrowserProps) {
  const [isUploading, setUploading] = React.useState(false);
  const [nodeTree, dispatchFileAction] = React.useReducer(setNodeTree, null);
  const uploader = React.useRef<HTMLInputElement>(null);
  const selectFile = (file: IFile) => {
    if (props.onFileClick) {
      props.onFileClick(file);
    }
  };

  const openFolder = React.useCallback((file?: IFile) => {
    if (!file) {
      FileAPI.getFileMeta(GameModel.selectCurrent().id!, '/').then(
        (rootFile: IFile) => {
          FileAPI.getFileList(GameModel.selectCurrent().id!, '/').then(
            (children: IFile[]) => {
              const childrenNode = children.map(file => {
                return { file: file, children: [] };
              });

              const node = {
                file: rootFile,
                children: childrenNode.length > 0 ? childrenNode : [null],
              };
              dispatchFileAction({ type: 'OpenFolder', node: node });
            },
          );
        },
      );
    } else {
      FileAPI.getFileList(
        GameModel.selectCurrent().id!,
        isDirectory(file) ? getAbsoluteFileName(file) : file.path,
      ).then((children: IFile[]) => {
        const childrenNode = children.map(file => {
          return { file: file, children: [] };
        });
        const node = {
          file: file,
          children: childrenNode.length > 0 ? childrenNode : [null],
        };
        dispatchFileAction({ type: 'OpenFolder', node: node });
      });
    }
  }, []);

  const closeFolder = React.useCallback((file: IFile) => {
    dispatchFileAction({
      type: 'CloseFolder',
      node: { file: file, children: [] },
    });
  }, []);

  const addNewDirectory = React.useCallback(
    (parentDir: IFile) => {
      const newDirName = prompt(
        'Please enter the name of the new directory',
        '',
      );
      FileAPI.createFile(
        GameModel.selectCurrent().id!,
        newDirName!,
        getAbsoluteFileName(parentDir),
      ).then(() => openFolder(parentDir));
    },
    [openFolder],
  );

  const insertFiles = React.useCallback(
    (
      files: FileList,
      parentDir?: IFile,
      force?: boolean,
      fileName?: string,
    ) => {
      const finaly = (i: number) => {
        return (e?: any) => {
          if (e && e.status && e.status !== 200) {
            if (
              confirm(
                'This file [' +
                  files[i].name +
                  '] already exists, do you want to override it?',
              )
            ) {
              FileAPI.createFile(
                GameModel.selectCurrent().id!,
                fileName ? fileName : files[i].name,
                parentDir ? getAbsoluteFileName(parentDir) : '/',
                files[i],
                true,
              );
            }
          }
          if (i === files.length - 1) {
            setUploading(false);
            openFolder(parentDir);
          }
        };
      };
      setUploading(true);
      for (let i = 0; i < files.length; i += 1) {
        FileAPI.createFile(
          GameModel.selectCurrent().id!,
          fileName ? fileName : files[i].name,
          parentDir ? getAbsoluteFileName(parentDir) : '/',
          files[i],
          force,
        ).then(finaly(i), finaly(i)); // Fires finaly when "then" and "catch" like a true "finally"
      }
    },
    [openFolder],
  );

  const uploadFiles = React.useCallback(
    (parentDir: IFile) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const target = event.target;
      if (target && target.files && target.files.length > 0) {
        if (isDirectory(parentDir)) {
          insertFiles(target.files, parentDir);
        } else if (nodeTree) {
          // If target is not a directory, we have to find the parent and force upload the new file
          const oldFile = parentDir;
          findFile(nodeTree, { file: oldFile, children: [] }, parentNode => {
            if (target.files && target.files.length > 0) {
              const newType = target.files[0].type;
              const oldType = oldFile.mimeType;
              if (
                newType === oldType ||
                confirm(
                  'You are about to change file type from [' +
                    oldType +
                    '] to [' +
                    newType +
                    ']. Are you sure?',
                )
              ) {
                insertFiles(target.files, parentNode.file, true, oldFile.name);
              }
            }
            return parentNode;
          });
        }
      }
    },
    [insertFiles, nodeTree],
  );

  const addNewFile = React.useCallback(
    (uploader: HTMLInputElement | null) => (event: React.MouseEvent) => {
      event.stopPropagation();
      if (uploader) {
        uploader.click();
      }
    },
    [],
  );

  const deleteFile = React.useCallback(
    (file: IFile) => (e: React.MouseEvent) => {
      e.stopPropagation();
      FileAPI.deleteFile(
        GameModel.selectCurrent().id!,
        getAbsoluteFileName(file),
      ).then(() => {
        dispatchFileAction({
          type: 'RemoveFile',
          node: { file: file, children: [] },
        });
      });
    },
    [],
  );

  const [dropZoneProps, dropZone] = dnd.useDrop(
    dropSpecs(item => {
      const { files } = (item as unknown) as {
        files: FileList;
        items: DataTransferItemList;
      };
      insertFiles(files);
    }),
  );

  type RenderNodeType = (node?: FileNode | null) => JSX.Element;

  const renderNode: RenderNodeType = node => {
    if (node === null) {
      openFolder();
      return <div>Empty...</div>;
    } else if (node === undefined) {
      return renderNode(nodeTree);
    } else {
      if (node.file.name === '' && node.file.path === '/') {
        return (
          <div>
            {node.children.map((file: FileNode | null) => {
              if (file !== null) {
                return renderNode(file);
              } else {
                return <div>Empty...</div>;
              }
            })}
          </div>
        );
      } else {
        return (
          <FileBrowserNode
            key={getAbsoluteFileName(node.file)}
            node={node}
            openFolder={openFolder}
            closeFolder={closeFolder}
            selectFile={selectFile}
            addNewDirectory={addNewDirectory}
            addNewFile={addNewFile}
            deleteFile={deleteFile}
            insertFiles={insertFiles}
            uploadFiles={uploadFiles}
          />
        );
      }
    }
  };

  // React.useEffect(() => {
  //   debugger;
  //   if (props.selectedFiles && nodeTree) {
  //     const selectedKey = Object.keys(props.selectedFiles);
  //     for (const filePath of selectedKey) {
  //       openFolder(props.selectedFiles[filePath]);
  //     }
  //   }
  // }, [props.selectedFiles, openFolder, nodeTree]);

  console.log('RENDEEEEER', props);

  return (
    <div>
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
      {isUploading && (
        <div
          style={{
            position: 'absolute',
            backgroundColor: 'rgba(255, 0, 0, 0.2)',
            width: '100%',
            height: '100%',
          }}
        >
          Uploading!
        </div>
      )}
      {nodeTree && (
        <>
          <IconButton
            icon={'folder-plus'}
            tooltip={'Add new directory in root folder'}
            disabled={!isUploadAllowed(nodeTree.file)}
            onClick={() => addNewDirectory(nodeTree.file)}
          />
          <IconButton
            icon={'file-upload'}
            tooltip={'Upload file in the folder'}
            disabled={!isUploadAllowed(nodeTree.file)}
            onClick={addNewFile(uploader.current)}
          />
          <input
            ref={uploader}
            type="file"
            name="file"
            multiple={true}
            className={hiddenFileBrowserStyle}
            onChange={uploadFiles(nodeTree.file)}
          />
        </>
      )}

      {renderNode()}
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

export const FileBrowserTree = defaultContextManager<React.ComponentType>(
  ConnectedFileFileBrowser,
);
