import * as React from 'react';
import { useDrop, DragObjectWithType, DropTargetMonitor } from 'react-dnd';
import { css, cx } from 'emotion';
import { themeVar } from '../../../Components/Theme';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import {
  generateAbsolutePath,
  FileAPI,
  FILE_BASE,
} from '../../../API/files.api';
import { IconButton } from '../../../Components/Button/IconButton';
import { TextPrompt } from '../TextPrompt';
import { ConfirmButton } from '../../../Components/Button/ConfirmButton';
import { GameModel } from '../../../data/selectors';
import { NativeTypes } from 'react-dnd-html5-backend';
import { file } from '@babel/types';
import { StyledLabel } from '../../../Components/AutoImport/String/Label';

const grow = css({
  flex: '1 1 auto',
});
const flex = css({
  display: 'flex',
});
const block = css({
  display: 'block',
});
const hidden = css({
  display: 'none',
});

const selectedRow = css({
  backgroundColor: themeVar.primaryLighterColor,
});

const hoverRow = css({
  cursor: 'pointer',
  ':hover': {
    backgroundColor: themeVar.primaryHoverColor,
  },
});

const dropZoneStyle = css({
  borderStyle: 'solid',
  borderWidth: '2px',
  borderColor: 'red',
});

const isDirectory = (file: IFileDescriptor) =>
  file.mimeType === 'application/wfs-directory';

/**
 * Returns url to read a file
 * @param absolutePath the absolute path of the file to read
 */
const fileURL = (absolutePath: string) => {
  return (
    API_ENDPOINT +
    FILE_BASE(GameModel.selectCurrent().id!) +
    'read' +
    absolutePath
  );
};

const isSelected = (file: IFileDescriptor, selectedPaths: string[]) =>
  selectedPaths.includes(generateAbsolutePath(file));

const isChildrenSelected = (file: IFileDescriptor, selectedPaths: string[]) => {
  for (const path in selectedPaths) {
    if (path.includes(generateAbsolutePath(file))) {
      return true;
    }
  }
  return false;
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

const gameModelDependsOnModel = () => {
  return (
    GameModel.selectCurrent().type === 'SCENARIO' &&
    GameModel.selectCurrent().basedOnId !== null
  );
};

const isUploadAllowed = (file?: IFileDescriptor) => {
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

const dropSpecs = (action: DropAction) => ({
  accept: NativeTypes.FILE,
  canDrop: () => true,
  drop: action,
  collect: (mon: DropTargetMonitor) => ({
    isOver: !!mon.isOver(),
    isShallowOver: !!mon.isOver({ shallow: true }),
    canDrop: !!mon.canDrop(),
  }),
});

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

interface ModalStateClose {
  type: 'close';
}

interface ModalStateError {
  type: 'error';
  label: string;
}

interface ModalStateFilename {
  type: 'filename';
}

interface ModalStateOverride {
  type: 'override';
  files: File[];
}

interface ModalStateDelete {
  type: 'delete';
}

interface ModalStateChangeType {
  type: 'type';
  file: File;
}

type ModalState =
  | ModalStateClose
  | ModalStateError
  | ModalStateFilename
  | ModalStateOverride
  | ModalStateDelete
  | ModalStateChangeType;

interface FileBrowserNodeProps {
  currentFile: IFileDescriptor;
  selectedPaths?: string[];
  defaultOpen?: boolean;
  noBracket?: boolean;
  noDelete?: boolean;
  onFileClick?: (
    file: IFileDescriptor,
    onFileUpdate?: (updatedFile: IFileDescriptor) => void,
  ) => void;
  onDelelteFile?: (deletedFile: IFileDescriptor) => void;
}

export function FileBrowserNode({
  currentFile,
  selectedPaths = [],
  defaultOpen = false,
  noBracket = false,
  noDelete = false,
  onFileClick = () => {},
  onDelelteFile = () => {},
}: FileBrowserNodeProps) {
  const [open, setOpen] = React.useState(
    defaultOpen || isChildrenSelected(currentFile, selectedPaths) || noBracket,
  );
  const [modalState, setModalState] = React.useState<ModalState>({
    type: 'close',
  });
  const [children, setChildren] = React.useState<IFileDescriptor[]>();
  const [nbUploadingFiles, dispatchUploadingFiles] = React.useReducer(
    (uploadCount: number, action: { type: 'increment' | 'decrement' }) => {
      switch (action.type) {
        case 'increment':
          return uploadCount + 1;
        case 'decrement':
          return uploadCount - 1;
        default:
          return uploadCount;
      }
    },
    0,
  );

  const uploader = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isDirectory(currentFile)) {
      FileAPI.getFileList(generateAbsolutePath(currentFile))
        .then(files => {
          setChildren(files);
        })
        .catch(({ statusText }: Response) => {
          setModalState({
            type: 'error',
            label: statusText,
          });
          setChildren([]);
        });
    }
  }, [currentFile]);

  const openUploader = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (uploader.current) {
      uploader.current.click();
    }
  };

  function getChildren(name: string) {
    return (
      children &&
      children.find(
        child =>
          generateAbsolutePath(child) ===
          generateAbsolutePath({
            path: generateAbsolutePath(currentFile),
            name: name,
          }),
      )
    );
  }

  function insertDirectory(name: string) {
    const oldFile = getChildren(name);
    if (oldFile) {
      setModalState({
        type: 'error',
        label: `Directory [${generateAbsolutePath({
          path: currentFile.path,
          name: name,
        })}] allready exists`,
      });
    } else {
      FileAPI.createFile(name, generateAbsolutePath(currentFile))
        .then(savedFile => {
          setChildren(oldChildren => {
            if (oldChildren) {
              return [...oldChildren, savedFile];
            }
          });
          setModalState({ type: 'close' });
          setOpen(true);
        })
        .catch(({ statusText }: Response) => {
          setModalState({
            type: 'error',
            label: statusText,
          });
        });
    }
  }

  function insertFile(
    file: File,
    onAction?: (newFile?: IFileDescriptor) => void,
    force: boolean = false,
  ) {
    const oldFile = getChildren(file.name);
    if (oldFile && !force) {
      setModalState(oldState => ({
        type: 'override',
        files: [...(oldState.type === 'override' ? oldState.files : []), file],
      }));
    } else {
      dispatchUploadingFiles({ type: 'increment' });
      FileAPI.createFile(
        file.name,
        generateAbsolutePath(currentFile),
        file,
        force,
      )
        .then(savedFile => {
          dispatchUploadingFiles({ type: 'decrement' });
          setChildren(oldChildren => {
            if (oldChildren) {
              return [...oldChildren, savedFile];
            }
          });
          onAction && onAction(savedFile);
        })
        .catch(({ statusText }: Response) => {
          setModalState({
            type: 'error',
            label: statusText,
          });
          dispatchUploadingFiles({ type: 'decrement' });
          onAction && onAction();
        });
    }
  }

  function updateFile(file: File, force: boolean = false) {
    if (file.type !== currentFile.mimeType && !force) {
      setModalState({
        type: 'type',
        file: file,
      });
    } else {
      dispatchUploadingFiles({ type: 'increment' });
      FileAPI.createFile(currentFile.name, currentFile.path, file, true)
        .then(() => {
          setModalState({ type: 'close' });
          dispatchUploadingFiles({ type: 'decrement' });
        })
        .catch(({ statusText }: Response) => {
          setModalState({
            type: 'error',
            label: statusText,
          });
          dispatchUploadingFiles({ type: 'decrement' });
        });
    }
  }

  function insertFiles(
    files: FileList,
    onAction?: (newFiles: IFileDescriptor[]) => void,
  ) {
    const successFiles: IFileDescriptor[] = [];
    for (let i = 0; i < files.length; ++i) {
      insertFile(files[i], newFile => {
        if (newFile) {
          successFiles.push(newFile);
        }
        if (i === file.length - 1) {
          onAction && onAction(successFiles);
        }
      });
    }
  }

  const deleteFile = (file: IFileDescriptor) => {
    FileAPI.deleteFile(generateAbsolutePath(file), true)
      .then(deletedFile => {
        onDelelteFile && onDelelteFile(deletedFile);
        setModalState({ type: 'close' });
      })
      .catch(({ statusText }: Response) => {
        setModalState({
          type: 'error',
          label: statusText,
        });
      });
  };

  const openFile = (file: IFileDescriptor) => {
    const win = window.open(fileURL(generateAbsolutePath(file)), '_blank');
    win!.focus();
  };

  const [dropZoneProps, dropZone] = useDrop(
    dropSpecs(item => {
      const { files } = (item as unknown) as {
        files: FileList;
        items: DataTransferItemList;
      };
      if (dropZoneProps.isShallowOver) {
        insertFiles(files, newFiles => {
          if (newFiles.length > 0) {
            setOpen(true);
          }
        });
      }
    }),
  );

  const timeoutBeforeExpend = 1000;

  React.useEffect(() => {
    let openTimeout: number | undefined;
    if (isDirectory(currentFile)) {
      if (dropZoneProps.isShallowOver && dropZoneProps.canDrop) {
        openTimeout = (setTimeout(
          () => setOpen(true),
          timeoutBeforeExpend,
        ) as unknown) as number;
      }
      return () => {
        clearTimeout(openTimeout);
      };
    }
  }, [dropZoneProps, currentFile]);

  return (
    <div ref={dropZone} className={cx(flex, grow)}>
      <input
        ref={uploader}
        type="file"
        name="file"
        multiple={isDirectory(currentFile)}
        className={hidden}
        onChange={event => {
          if (event.target.files && event.target.files.length > 0) {
            if (isDirectory(currentFile)) {
              insertFiles(event.target.files);
            } else {
              updateFile(event.target.files[0]);
            }
          }
        }}
      />
      {isDirectory(currentFile) && !noBracket && (
        <div className={css({ verticalAlign: 'top' })}>
          <IconButton
            icon={open ? 'caret-down' : 'caret-right'}
            onClick={event => {
              event.stopPropagation();
              event.preventDefault();
              setOpen(oldOpen => !oldOpen);
            }}
            fixedWidth={true}
          />
        </div>
      )}
      <div className={cx(block, grow)}>
        <div
          className={cx(flex, grow, hoverRow, {
            [dropZoneStyle]:
              isDirectory(currentFile) && dropZoneProps.isShallowOver,
            [selectedRow]: isSelected(currentFile, selectedPaths),
          })}
          onClick={() => onFileClick(currentFile)}
        >
          <IconButton
            icon={getIconForFileType(currentFile.mimeType)}
            fixedWidth={true}
          />
          <div className={grow}>{currentFile.name}</div>
          {nbUploadingFiles > 0 && (
            <div className={grow}>
              <StyledLabel
                value={`Uploading ${nbUploadingFiles} files`}
                type="warning"
              />
            </div>
          )}
          <div className={flex}>
            {modalState.type === 'filename' && (
              <TextPrompt
                placeholder="Directory name"
                onAction={(success, value) => {
                  if (success) {
                    insertDirectory(value);
                  } else {
                    setModalState({ type: 'close' });
                  }
                }}
                onBlur={() => setModalState({ type: 'close' })}
                applyOnEnter
                defaultFocus
              />
            )}
            {modalState.type === 'type' && (
              <ConfirmButton
                icon={'trash'}
                label={`Are you sure that you want to change the file type from [${
                  currentFile.mimeType
                }] to [${modalState.file.type}]`}
                onAction={success => {
                  if (success) {
                    updateFile(modalState.file, true);
                  } else {
                    setModalState({ type: 'close' });
                  }
                }}
                fixedWidth
                defaultConfirm
              />
            )}
            {modalState.type === 'close' &&
              (isDirectory(currentFile) ? (
                <>
                  <IconButton
                    icon={'folder-plus'}
                    tooltip={'Add new directory in folder'}
                    disabled={!isUploadAllowed(currentFile)}
                    onClick={event => {
                      event.stopPropagation();
                      setModalState({ type: 'filename' });
                    }}
                    fixedWidth={true}
                  />
                  <IconButton
                    icon={'file-upload'}
                    tooltip={'Upload file in the folder'}
                    disabled={!isUploadAllowed(currentFile)}
                    onClick={openUploader}
                    fixedWidth={true}
                  />
                </>
              ) : (
                <>
                  <IconButton
                    icon={'external-link-alt'}
                    tooltip={'Open file'}
                    onClick={event => {
                      event.stopPropagation();
                      openFile(currentFile);
                    }}
                    fixedWidth={true}
                  />
                  <IconButton
                    icon={'file-import'}
                    tooltip={'Upload new version'}
                    disabled={!isUploadAllowed(currentFile)}
                    onClick={openUploader}
                    fixedWidth={true}
                  />
                </>
              ))}
            {modalState.type === 'close' && !noDelete && (
              <ConfirmButton
                icon={'trash'}
                tooltip={'Delete'}
                onAction={success => {
                  if (success) {
                    if (children && children.length > 0) {
                      setModalState({ type: 'delete' });
                    } else {
                      deleteFile(currentFile);
                    }
                  }
                }}
                fixedWidth
              />
            )}
            {modalState.type === 'delete' && (
              <ConfirmButton
                label="Are you sure to delete the folder and all its subdirectories?"
                defaultConfirm
                icon={'trash'}
                tooltip={'Force delete'}
                onAction={success => {
                  if (success) {
                    deleteFile(currentFile);
                  }
                  setModalState({ type: 'close' });
                }}
                fixedWidth
              />
            )}
            {modalState.type === 'error' && (
              <StyledLabel
                value={modalState.label}
                type="error"
                duration={3000}
                onLabelVanish={() => setModalState({ type: 'close' })}
              />
            )}
            {modalState.type === 'override' && (
              <ConfirmButton
                icon={'trash'}
                label={`Are you sure that you want to override the file [${
                  modalState.files[0].name
                }]`}
                onAction={success => {
                  const removeFile = () =>
                    setModalState(oldState => {
                      if (
                        oldState.type === 'override' &&
                        oldState.files.length > 1
                      ) {
                        return {
                          ...oldState,
                          files: oldState.files.slice(1),
                        };
                      }
                      return { type: 'close' };
                    });

                  if (success) {
                    insertFile(
                      modalState.files[0],
                      newFile => {
                        if (!newFile) {
                          setModalState({
                            type: 'error',
                            label: 'File insertion failed',
                          });
                        }
                        removeFile();
                      },
                      true,
                    );
                  } else {
                    removeFile();
                  }
                }}
                fixedWidth
                defaultConfirm
              />
            )}
          </div>
        </div>
        <div className={cx(block, grow)}>
          {isDirectory(currentFile) &&
            open &&
            (children
              ? children.length > 0
                ? children.sort(sortFiles).map(child => (
                    <FileBrowserNode
                      key={generateAbsolutePath(child)}
                      currentFile={child}
                      onDelelteFile={deletedFile => {
                        setChildren(oldChildren => {
                          if (oldChildren) {
                            return oldChildren.filter(
                              child =>
                                generateAbsolutePath(child) !==
                                generateAbsolutePath(deletedFile),
                            );
                          }
                        });
                        onDelelteFile && onDelelteFile(deletedFile);
                      }}
                      onFileClick={onFileClick}
                      selectedPaths={selectedPaths}
                    />
                  ))
                : 'Empty...'
              : 'Loading...')}
        </div>
      </div>
    </div>
  );
}
