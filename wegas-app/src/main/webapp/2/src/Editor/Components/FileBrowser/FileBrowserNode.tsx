import * as React from 'react';
import { useDrop, DragObjectWithType, DropTargetMonitor } from 'react-dnd';
import { css, cx } from 'emotion';
import {
  themeVar,
  localSelection,
  globalSelection,
} from '../../../Components/Style/Theme';
import { IconName } from '@fortawesome/fontawesome-svg-core';
import { generateAbsolutePath, FileAPI, fileURL } from '../../../API/files.api';
import { IconButton } from '../../../Components/Inputs/Buttons/IconButton';
import { TextPrompt } from '../TextPrompt';
import { ConfirmButton } from '../../../Components/Inputs/Buttons/ConfirmButton';
import { GameModel } from '../../../data/selectors';
import { NativeTypes } from 'react-dnd-html5-backend';
import { store, StoreDispatch } from '../../../data/store';
import { editFile } from '../../../data/Reducer/globalState';
import { flex, grow, hidden, block } from '../../../css/classes';
import { MessageString } from '../MessageString';
import { FilePickingType, FileFilter } from './FileBrowser';
import { classNameOrEmpty } from '../../../Helper/className';

const clickableStyle = css({
  cursor: 'pointer',
  ':hover': {
    backgroundColor: themeVar.primaryHoverColor,
  },
});

const disabledStyle = css({
  color: themeVar.disabledColor,
});

const dropZoneStyle = css({
  borderStyle: 'solid',
  borderWidth: '2px',
  borderColor: 'red',
});

const isDirectory = (file: IAbstractContentDescriptor) =>
  file.mimeType === 'application/wfs-directory';

const isSelected = (
  file: IAbstractContentDescriptor,
  selectedPaths: string[],
) => selectedPaths.includes(generateAbsolutePath(file));

const isChildrenSelected = (
  file: IAbstractContentDescriptor,
  selectedPaths: string[],
) => {
  for (const path in selectedPaths) {
    if (path.includes(generateAbsolutePath(file))) {
      return true;
    }
  }
  return false;
};

const sortFiles = (
  a: IAbstractContentDescriptor,
  b: IAbstractContentDescriptor,
): number => {
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

const isUploadAllowed = (file?: IAbstractContentDescriptor) => {
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

const dropSpecs = (action: DropAction, disabled: boolean) => ({
  accept: NativeTypes.FILE,
  canDrop: () => !disabled,
  drop: action,
  collect: (mon: DropTargetMonitor) => ({
    isOver: !!mon.isOver() && !disabled,
    isShallowOver: !!mon.isOver({ shallow: true }) && !disabled,
    canDrop: !!mon.canDrop() && !disabled,
  }),
});

const getIconForFileType = (fileType: string): IconName => {
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

export interface FileBrowserNodeProps extends ClassAndStyle {
  defaultFile: IAbstractContentDescriptor;
  selectedLocalPaths?: string[];
  selectedGlobalPaths?: string[];
  defaultOpen?: boolean;
  noBracket?: boolean;
  noDelete?: boolean;
  onFileClick?: (
    file: IAbstractContentDescriptor,
    onFileUpdate?: (updatedFile: IAbstractContentDescriptor) => void,
  ) => void;
  onDelelteFile?: (deletedFile: IAbstractContentDescriptor) => void;
  localDispatch?: StoreDispatch;
  pick?: FilePickingType;
  filter?: FileFilter;
}

export function FileBrowserNode({
  defaultFile,
  selectedLocalPaths = [],
  selectedGlobalPaths = [],
  defaultOpen = false,
  noBracket = false,
  noDelete = false,
  onFileClick = () => {},
  onDelelteFile = () => {},
  localDispatch,
  pick,
  filter,
  className,
  style,
}: FileBrowserNodeProps) {
  const [open, setOpen] = React.useState(
    defaultOpen ||
      isChildrenSelected(defaultFile, selectedLocalPaths) ||
      isChildrenSelected(defaultFile, selectedGlobalPaths) ||
      noBracket,
  );
  const [modalState, setModalState] = React.useState<ModalState>({
    type: 'close',
  });
  const [children, setChildren] = React.useState<
    IAbstractContentDescriptor[]
  >();
  const [currentFile, setCurrentFile] = React.useState<
    IAbstractContentDescriptor
  >(defaultFile);
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
    if (isDirectory(defaultFile)) {
      FileAPI.getFileList(generateAbsolutePath(defaultFile))
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
  }, [defaultFile]);

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
    onAction?: (newFile?: IAbstractContentDescriptor) => void,
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
    onAction?: (newFiles: IAbstractContentDescriptor[]) => void,
  ) {
    const successFiles: IAbstractContentDescriptor[] = [];
    for (let i = 0; i < files.length; ++i) {
      insertFile(files[i], newFile => {
        if (newFile) {
          successFiles.push(newFile);
        }
        if (i === files.length - 1) {
          onAction && onAction(successFiles);
        }
      });
    }
  }

  const deleteFile = (file: IAbstractContentDescriptor) => {
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

  const openFile = (file: IAbstractContentDescriptor) => {
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
    }, pick != null),
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

  const pickApproved =
    !pick ||
    pick === 'BOTH' ||
    (pick === 'FOLDER' && isDirectory(currentFile)) ||
    (pick === 'FILE' && !isDirectory(currentFile));
  const typeFilterApproved =
    !filter || currentFile.mimeType.includes(filter.fileType);
  const greyFiltered =
    !isDirectory(currentFile) &&
    filter &&
    !currentFile.mimeType.includes(filter.fileType);

  //TODO : Improve node layout using flex only

  return !filter || filter.filterType !== 'hide' || typeFilterApproved ? (
    <div
      ref={dropZone}
      className={cx(flex, grow) + classNameOrEmpty(className)}
      style={style}
    >
      {!pick && (
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
      )}
      {isDirectory(currentFile) && !noBracket && (
        <div className={css({ verticalAlign: 'top' })}>
          <IconButton
            icon={open ? 'caret-down' : 'caret-right'}
            onClick={event => {
              event.stopPropagation();
              event.preventDefault();
              setOpen(oldOpen => !oldOpen);
            }}
          />
        </div>
      )}
      <div className={cx(block, grow)}>
        <div
          className={cx(flex, grow, {
            [clickableStyle]: typeFilterApproved,
            [disabledStyle]: greyFiltered,
            [dropZoneStyle]:
              isDirectory(currentFile) && dropZoneProps.isShallowOver,
            [localSelection]: isSelected(currentFile, selectedLocalPaths),
            [globalSelection]: isSelected(currentFile, selectedGlobalPaths),
          })}
          onClick={(e: ModifierKeysEvent) => {
            if (typeFilterApproved && pickApproved) {
              onFileClick(currentFile, setCurrentFile);
              if (!pick) {
                const dispatch =
                  e.ctrlKey && localDispatch ? localDispatch : store.dispatch;
                dispatch(editFile(currentFile, setCurrentFile));
              }
            }
          }}
        >
          <IconButton
            disabled={greyFiltered}
            icon={getIconForFileType(currentFile.mimeType)}
          />
          <div className={grow}>{currentFile.name}</div>
          {nbUploadingFiles > 0 && (
            <div className={grow}>
              <MessageString
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
                label={`Are you sure that you want to change the file type from [${currentFile.mimeType}] to [${modalState.file.type}]`}
                onAction={success => {
                  if (success) {
                    updateFile(modalState.file, true);
                  } else {
                    setModalState({ type: 'close' });
                  }
                }}
                defaultConfirm
              />
            )}
            {modalState.type === 'close' &&
              !pick &&
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
                  />
                  <IconButton
                    icon={'file-upload'}
                    tooltip={'Upload file in the folder'}
                    disabled={!isUploadAllowed(currentFile)}
                    onClick={openUploader}
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
                  />
                  <IconButton
                    icon={'file-import'}
                    tooltip={'Upload new version'}
                    disabled={!isUploadAllowed(currentFile)}
                    onClick={openUploader}
                  />
                </>
              ))}
            {modalState.type === 'close' && !noDelete && !pick && (
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
              />
            )}
            {modalState.type === 'error' && (
              <MessageString
                value={modalState.label}
                type="error"
                duration={3000}
                onLabelVanish={() => setModalState({ type: 'close' })}
              />
            )}
            {modalState.type === 'override' && (
              <ConfirmButton
                icon={'trash'}
                label={`Are you sure that you want to override the file [${modalState.files[0].name}]`}
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
                      defaultFile={child}
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
                      selectedLocalPaths={selectedLocalPaths}
                      selectedGlobalPaths={selectedGlobalPaths}
                      localDispatch={localDispatch}
                      filter={filter}
                      pick={pick}
                    />
                  ))
                : 'Empty...'
              : 'Loading...')}
        </div>
      </div>
    </div>
  ) : null;
}
