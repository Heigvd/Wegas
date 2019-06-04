import * as React from 'react';
import { FileAPI } from '../../../../API/files.api';
import {
  getAbsoluteFileName,
  isDirectory,
} from '../../../../data/methods/ContentDescriptor';
import { __EXPERIMENTAL_DND_HOOKS_THAT_MAY_CHANGE_AND_BREAK_MY_BUILD__ as dnd } from 'react-dnd';
import {
  dropSpecs,
  hiddenFileBrowserStyle,
  dropZoneStyle,
  isUploadAllowed,
} from './FileBrowser';
import { IconButton } from '../../../../Components/Button/IconButton';
import { css, cx } from 'emotion';
import { themeVar } from '../../../../Components/Theme';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

const selectedRow = css({
  backgroundColor: themeVar.primaryLighterColor,
});

const hoverRow = css({
  cursor: 'pointer',
  ':hover': {
    backgroundColor: themeVar.primaryHoverColor,
  },
});

export interface FileNode {
  file: IFile;
  selected?: boolean;
  childrenIds?: string[];
  open?: boolean;
}

export const isNodeDirectory = (
  node: FileNode,
): node is FileNode & { childrenIds: string[] } =>
  node.childrenIds !== undefined;

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

interface FileBrowserNodeProps {
  node: FileNode;
  selected?: boolean;
  openFolder: (node: FileNode, open?: boolean) => void;
  selectFile: (file: FileNode) => void;
  addNewDirectory: (file: IFile) => void;
  deleteFile: (baseDir: FileNode) => void;
  insertFiles: (files: FileList, path?: string) => void;
  uploadFiles: (
    targetNode: FileNode,
  ) => (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FileBrowserNode(
  props: React.PropsWithChildren<FileBrowserNodeProps>,
) {
  const {
    node,
    selected,
    openFolder,
    selectFile,
    addNewDirectory,
    deleteFile,
    insertFiles,
    uploadFiles,
    children,
  } = props;

  const uploader = React.useRef<HTMLInputElement>(null);

  const openFile = (file: IFile) => {
    const win = window.open(
      FileAPI.fileURL(getAbsoluteFileName(file)),
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
      insertFiles(files, getAbsoluteFileName(node.file));
    }),
  );

  const timeoutBeforeExpend = 1000;

  React.useEffect(() => {
    let openTimeout: number | undefined;
    if (isDirectory(node.file)) {
      if (dropZoneProps.isShallowOver && dropZoneProps.canDrop) {
        openTimeout = (setTimeout(
          () => openFolder(node, true),
          timeoutBeforeExpend,
        ) as unknown) as number;
      }
      return () => {
        clearTimeout(openTimeout);
      };
    }
  }, [dropZoneProps, node, openFolder]);

  const addNewFile = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (uploader.current) {
      uploader.current.click();
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <input
        ref={uploader}
        type="file"
        name="file"
        multiple={isNodeDirectory(node)}
        className={hiddenFileBrowserStyle}
        onChange={uploadFiles(node)}
      />

      {isNodeDirectory(node) && (
        <IconButton
          icon={node.open ? 'caret-down' : 'caret-right'}
          onClick={() => openFolder(node, !node.open)}
          className={css({ float: 'left', height: 'fit-content' })}
          fixedWidth={true}
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
            selected ? selectedRow : '',
          )}
          onClick={() => selectFile(node)}
        >
          <IconButton
            icon={getIconForFileType(node.file.mimeType)}
            fixedWidth={true}
          />
          {node.file.name}
          <span style={{ float: 'right' }}>
            {isDirectory(node.file) ? (
              <>
                <IconButton
                  icon={'folder-plus'}
                  tooltip={'Add new directory in folder'}
                  disabled={!isUploadAllowed(node)}
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    addNewDirectory(node.file);
                  }}
                  fixedWidth={true}
                />
                <IconButton
                  icon={'file-upload'}
                  tooltip={'Upload file in the folder'}
                  disabled={!isUploadAllowed(node)}
                  onClick={addNewFile}
                  fixedWidth={true}
                />
              </>
            ) : (
              <>
                <IconButton
                  icon={'external-link-alt'}
                  tooltip={'Open file'}
                  onClick={() => openFile(node.file)}
                  fixedWidth={true}
                />
                <IconButton
                  icon={'file-import'}
                  tooltip={'Upload new version'}
                  disabled={!isUploadAllowed(node)}
                  onClick={addNewFile}
                  fixedWidth={true}
                />
              </>
            )}

            <IconButton
              icon={'trash'}
              tooltip={'Delete'}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                deleteFile(node);
              }}
              fixedWidth={true}
            />
          </span>
        </div>
        {isNodeDirectory(node) && node.open && <div>{children}</div>}
      </div>
    </div>
  );
}
