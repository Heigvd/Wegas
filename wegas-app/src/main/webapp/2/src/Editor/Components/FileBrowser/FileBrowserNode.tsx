import * as React from 'react';
import { useDrop, DragObjectWithType, DropTargetMonitor } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';

import { css, cx } from 'emotion';
import {
  flex,
  grow,
  hidden,
  block,
  localSelection,
  globalSelection,
  disabledColorStyle,
  infoShortTextStyle,
  defaultMarginLeft,
  defaultMarginBottom,
  thinHoverColorInsetShadow,
  textCenter,
  dropZoneStyle,
} from '../../../css/classes';
import { classNameOrEmpty } from '../../../Helper/className';

import { IAbstractContentDescriptor } from 'wegas-ts-api';

import { store, StoreDispatch } from '../../../data/Stores/store';
import { GameModel } from '../../../data/selectors';
import { editFile } from '../../../data/Reducer/globalState';

import { themeVar } from '../../../Components/Style/ThemeVars';
import { Button } from '../../../Components/Inputs/Buttons/Button';
import { ConfirmButton } from '../../../Components/Inputs/Buttons/ConfirmButton';
import { TextPrompt } from '../TextPrompt';
import { MessageString } from '../MessageString';

import { generateAbsolutePath, FileAPI, fileURL } from '../../../API/files.api';
import {
  isDirectory,
  isFile,
  isImage,
  formatFileSize,
  getIconForFile,
} from '../../../Helper/fileTools';
import { FilePickingType, FileFilter } from './FileBrowser';

////////////////////////////////////////////////////////////////////////////////////////////////////
// styles

const clickableStyle = css({
  cursor: 'pointer',
  ':hover': {
    backgroundColor: themeVar.Common.colors.HoverColor,
  },
});

const noToggleStyle = css({
  margin: '0 0.8em',
  color: themeVar.Common.colors.DarkTextColor,
});

const previewStyle = css(
  {
    position: 'fixed',
    backgroundColor: themeVar.Common.colors.BackgroundColor,
    maxWidth: '220px',
    margin: '3px 2em 10px',
    padding: '10px',
    borderWidth: '1px',
    borderRadius: themeVar.Common.dimensions.BorderRadius,
    fontSize: '75%',
  },
  thinHoverColorInsetShadow,
);

const inPreviewStyle = css(textCenter);

const imagePreviewStyle = css({
  maxWidth: '200px',
});

////////////////////////////////////////////////////////////////////////////////////////////////////
// NB: The selected paths are paths to be highlighted

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

////////////////////////////////////////////////////////////////////////////////////////////////////

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

////////////////////////////////////////////////////////////////////////////////////////////////////

const gameModelDependsOnModel = () => {
  return (
    GameModel.selectCurrent().type === 'SCENARIO' &&
    GameModel.selectCurrent().basedOnId !== null
  );
};

////////////////////////////////////////////////////////////////////////////////////////////////////

const isUploadAllowed = (file?: IAbstractContentDescriptor) => {
  return (
    file &&
    (!gameModelDependsOnModel() ||
      file.visibility === 'PRIVATE' ||
      file.visibility === 'INHERITED')
  );
};

////////////////////////////////////////////////////////////////////////////////////////////////////

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

////////////////////////////////////////////////////////////////////////////////////////////////////

interface ModalStateClose {
  type: 'close';
}

interface ModalStateError {
  type: 'error';
  label: string;
}

interface ModalStateFolderName {
  type: 'folderName';
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
  | ModalStateFolderName
  | ModalStateOverride
  | ModalStateDelete
  | ModalStateChangeType;

////////////////////////////////////////////////////////////////////////////////////////////////////
// React element

export interface FileBrowserNodeProps extends ClassStyleId {
  /**
   * item - item to display in a node
   */
  item: IAbstractContentDescriptor;
  /**
   * isRootNode - is root item
   */
  isRootNode?: boolean;
  /**
   * selectedLocalPaths - a path to be highlighted
   */
  selectedLocalPaths?: string[];
  /**
   * selectedGlobalPaths - a path to be highlighted
   */
  selectedGlobalPaths?: string[];
  /**
   * defaultOpened - by default, the current node is opened (expanded)
   */
  defaultOpened?: boolean;
  /**
   * noOpenCloseToggle - without open/close icon for folder
   */
  noToggle?: boolean;
  /**
   * noDelete - without option to delete
   */
  noDelete?: boolean;
  /**
   * readOnly - without option to upload file or create folder
   */
  readOnly?: boolean;
  /**
   * onFileClick - action on file click
   */
  onFileClick?: (
    file: IAbstractContentDescriptor,
    onFileUpdate?: (updatedFile: IAbstractContentDescriptor) => void,
  ) => void;
  /**
   * onDeleteFile - action on file deletion
   */
  onDeleteFile?: (deletedFile: IAbstractContentDescriptor) => void;
  /**
   * pickType - file picking options
   */
  pickType?: FilePickingType;
  /**
   * filter - file filtering options
   */
  filter?: FileFilter;
  /**
   * localDispatch
   */
  localDispatch?: StoreDispatch;
}

export function FileBrowserNode({
  item,
  isRootNode = false,
  selectedLocalPaths = [],
  selectedGlobalPaths = [],
  defaultOpened = false,
  noToggle = false,
  noDelete = false,
  readOnly = false,
  onFileClick = () => {},
  onDeleteFile = () => {},
  pickType,
  filter,
  localDispatch,
  className,
  style,
  disabled,
}: FileBrowserNodeProps) {
  const [opened, setOpened] = React.useState(
    defaultOpened ||
      isRootNode ||
      noToggle ||
      isChildrenSelected(item, selectedLocalPaths) ||
      isChildrenSelected(item, selectedGlobalPaths),
  );

  const [modalState, setModalState] = React.useState<ModalState>({
    type: 'close',
  });

  const [hoveringImageFile, setHoveringImageFile] = React.useState<boolean>(
    false,
  );

  const [displayPreview, setDisplayPreview] = React.useState<boolean>(false);

  const [children, setChildren] = React.useState<
    IAbstractContentDescriptor[]
  >();

  const [
    currentFile,
    setCurrentFile,
  ] = React.useState<IAbstractContentDescriptor>(item);

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
    if (isDirectory(item)) {
      FileAPI.getFileList(generateAbsolutePath(item))
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
  }, [item]);

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
          setOpened(true);
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
        onDeleteFile && onDeleteFile(deletedFile);
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
            setOpened(true);
          }
        });
      }
    }, readOnly),
  );

  const timeoutBeforeExpand = 1000;

  React.useEffect(() => {
    let openTimeout: number | undefined;
    if (isDirectory(currentFile)) {
      if (dropZoneProps.isShallowOver && dropZoneProps.canDrop) {
        openTimeout = (setTimeout(
          () => setOpened(true),
          timeoutBeforeExpand,
        ) as unknown) as number;
      }
      return () => {
        clearTimeout(openTimeout);
      };
    }
  }, [dropZoneProps, currentFile]);

  const timeoutBeforePreview = 750;

  React.useEffect(() => {
    let previewTimeout: number | undefined;
    if (hoveringImageFile) {
      previewTimeout = (setTimeout(
        () => setDisplayPreview(true),
        timeoutBeforePreview,
      ) as unknown) as number;
      return () => {
        setDisplayPreview(false);
        clearTimeout(previewTimeout);
      };
    } else {
      setDisplayPreview(false);
      clearTimeout(previewTimeout);
    }
  }, [hoveringImageFile, currentFile]);

  const pickTypeApproved =
    !pickType ||
    pickType === 'BOTH' ||
    (pickType === 'FOLDER' && isDirectory(currentFile)) ||
    (pickType === 'FILE' && isFile(currentFile));
  const filterApproved =
    !filter ||
    !filter.fileType ||
    currentFile.mimeType.includes(filter.fileType);
  const filterRefused =
    isFile(currentFile) &&
    filter &&
    filter.fileType &&
    !currentFile.mimeType.includes(filter.fileType);

  //TODO : Improve node layout using flex only

  return !filter ||
    filterApproved ||
    !(filter.filterType == 'hide' && filterRefused) ? (
    <div
      ref={dropZone}
      className={cx(flex, grow) + classNameOrEmpty(className)}
      style={style}
    >
      {!readOnly && (
        // hidden input required to browse file in the file system
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
          disabled = {disabled}
        />
      )}
      {!isRootNode &&
        (isDirectory(currentFile) && !noToggle ? (
          <div className={css({ verticalAlign: 'top' })}>
            <Button
              icon={opened ? 'caret-down' : 'caret-right'}
              onClick={event => {
                event.stopPropagation();
                event.preventDefault();
                setOpened(oldOpen => !oldOpen);
              }}
            />
          </div>
        ) : (
          <div className={noToggleStyle} />
        ))}
      <div className={cx(block, grow)}>
        <div
          className={cx(flex, grow, {
            [clickableStyle]: filterApproved && pickTypeApproved && !isRootNode,
            [disabledColorStyle]:
              filter && filter.filterType == 'grey' && filterRefused,
            [dropZoneStyle]:
              isDirectory(currentFile) && dropZoneProps.isShallowOver,
            [localSelection]: isSelected(currentFile, selectedLocalPaths),
            [globalSelection]: isSelected(currentFile, selectedGlobalPaths),
          })}
          onClick={(e: ModifierKeysEvent) => {
            if (filterApproved && pickTypeApproved && !isRootNode) {
              onFileClick(currentFile, setCurrentFile);
              if (!readOnly) {
                const dispatch =
                  e.ctrlKey && localDispatch ? localDispatch : store.dispatch;
                dispatch(editFile(currentFile, setCurrentFile));
              }
            }
          }}
          onMouseEnter={(
            _event: React.MouseEvent<HTMLDivElement, MouseEvent>,
          ) => {
            if (isImage(currentFile)) {
              setHoveringImageFile(true);
            }
          }}
          onMouseLeave={(
            _event: React.MouseEvent<HTMLDivElement, MouseEvent>,
          ) => {
            if (isImage(currentFile)) {
              setHoveringImageFile(false);
            }
          }}
        >
          {!isRootNode && (
            <>
              <Button
                disabled={
                  filter && filter.filterType == 'grey' && filterRefused
                }
                icon={getIconForFile(currentFile, opened)}
              />
              <div className={grow}>{currentFile.name}</div>
            </>
          )}
          {nbUploadingFiles > 0 && (
            <div className={grow}>
              <MessageString
                value={`Uploading ${nbUploadingFiles} files`}
                type="warning"
              />
            </div>
          )}
          <div className={flex}>
            {modalState.type === 'folderName' && (
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
            {modalState.type === 'close' && isFile(currentFile) && (
              <Button
                icon={'external-link-alt'}
                tooltip={'Open file'}
                onClick={event => {
                  event.stopPropagation();
                  openFile(currentFile);
                }}
              />
            )}
            {modalState.type === 'close' &&
              !readOnly &&
              (isDirectory(currentFile) ? (
                <>
                  <Button
                    label={isRootNode ? 'New folder' : ''}
                    icon={'folder-plus'}
                    tooltip={'Add new folder'}
                    disabled={!isUploadAllowed(currentFile)}
                    onClick={event => {
                      event.stopPropagation();
                      setModalState({ type: 'folderName' });
                    }}
                    className={cx(
                      { [defaultMarginBottom]: isRootNode },
                      { [defaultMarginLeft]: isRootNode },
                    )}
                  />
                  <Button
                    label={isRootNode ? 'Upload file' : ''}
                    icon={'file-upload'}
                    tooltip={'Upload file in the folder'}
                    disabled={!isUploadAllowed(currentFile)}
                    onClick={openUploader}
                    className={cx(
                      { [defaultMarginBottom]: isRootNode },
                      { [defaultMarginLeft]: isRootNode },
                    )}
                  />
                </>
              ) : (
                <Button
                  icon={'file-import'}
                  tooltip={'Upload new version'}
                  disabled={!isUploadAllowed(currentFile)}
                  onClick={openUploader}
                />
              ))}
            {modalState.type === 'close' &&
              !noDelete &&
              !readOnly &&
              !isRootNode && (
                <ConfirmButton
                  icon={'trash'}
                  tooltip={'Delete'}
                  className={flex}
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
                label="Are you sure to delete the folder and all its subdirectories ?"
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
        {displayPreview && (
          <div className={cx(previewStyle)}>
            <div className={cx(inPreviewStyle)}>
              <img
                className={cx(imagePreviewStyle)}
                src={fileURL(generateAbsolutePath(currentFile))}
              />
              <br />
              {currentFile.mimeType}
              <br />
              {formatFileSize(currentFile.bytes)}
            </div>
          </div>
        )}
        <div className={cx(block, grow)}>
          {isDirectory(currentFile) &&
            opened &&
            (children ? (
              children.length > 0 ? (
                children.sort(sortFiles).map(child => (
                  <FileBrowserNode
                    key={generateAbsolutePath(child)}
                    item={child}
                    selectedLocalPaths={selectedLocalPaths}
                    selectedGlobalPaths={selectedGlobalPaths}
                    defaultOpened={defaultOpened}
                    noToggle={noToggle}
                    noDelete={noDelete}
                    readOnly={readOnly}
                    onFileClick={onFileClick}
                    onDeleteFile={deletedFile => {
                      setChildren(oldChildren => {
                        if (oldChildren) {
                          return oldChildren.filter(
                            child =>
                              generateAbsolutePath(child) !==
                              generateAbsolutePath(deletedFile),
                          );
                        }
                      });
                      onDeleteFile && onDeleteFile(deletedFile);
                    }}
                    pickType={pickType}
                    filter={filter}
                    localDispatch={localDispatch}
                  />
                ))
              ) : (
                <div className={cx(noToggleStyle, infoShortTextStyle)}>
                  empty
                </div>
              )
            ) : (
              <div className={cx(noToggleStyle, infoShortTextStyle)}>
                Loading...
              </div>
            ))}
        </div>
      </div>
    </div>
  ) : null;
}
