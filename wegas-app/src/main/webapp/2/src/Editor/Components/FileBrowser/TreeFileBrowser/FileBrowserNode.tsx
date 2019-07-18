import * as React from 'react';
import { useDrop } from 'react-dnd';
import {
  dropSpecs,
  dropZoneStyle,
  isUploadAllowed,
  generateGoodPath,
  isDirectory,
  fileURL,
} from './FileBrowser';
import { IconButton } from '../../../../Components/Button/IconButton';
import { css, cx } from 'emotion';
import { themeVar } from '../../../../Components/Theme';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

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

export interface FileNode {
  file: IFileDescriptor;
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
  onSelectFile: (file: FileNode) => void;
  onOpen: (file: FileNode, open: boolean) => void;
  addNewDirectory: (file: IFileDescriptor) => void;
  deleteFile: (baseDir: FileNode) => void;
  insertFiles: (files: FileList, path?: string) => void;
  uploadFiles: (
    targetNode: FileNode,
  ) => (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FileBrowserNode({
  node,
  onSelectFile,
  onOpen,
  addNewDirectory,
  deleteFile,
  insertFiles,
  uploadFiles,
  children,
}: React.PropsWithChildren<FileBrowserNodeProps>) {
  const uploader = React.useRef<HTMLInputElement>(null);

  const openFile = (file: IFileDescriptor) => {
    const win = window.open(fileURL(generateGoodPath(file)), '_blank');
    win!.focus();
  };

  const [dropZoneProps, dropZone] = useDrop(
    dropSpecs(item => {
      const { files } = (item as unknown) as {
        files: FileList;
        items: DataTransferItemList;
      };
      insertFiles(files, generateGoodPath(node.file));
      onOpen(node, true);
    }),
  );

  const timeoutBeforeExpend = 1000;

  React.useEffect(() => {
    let openTimeout: number | undefined;
    if (isDirectory(node.file)) {
      if (dropZoneProps.isShallowOver && dropZoneProps.canDrop) {
        openTimeout = (setTimeout(
          () => onOpen(node, true),
          timeoutBeforeExpend,
        ) as unknown) as number;
      }
      return () => {
        clearTimeout(openTimeout);
      };
    }
  }, [dropZoneProps, node, onOpen]);

  const addNewFile = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    if (uploader.current) {
      uploader.current.click();
    }
  };

  return (
    <div ref={dropZone} className={cx(flex, grow)}>
      <input
        ref={uploader}
        type="file"
        name="file"
        multiple={isNodeDirectory(node)}
        className={hidden}
        onClick={event => {
          (event.target as HTMLInputElement).value = '';
        }}
        onChange={event => {
          uploadFiles(node)(event);
          onOpen(node, true);
        }}
      />
      {isNodeDirectory(node) && (
        <div className={css({ verticalAlign: 'top' })}>
          <IconButton
            icon={node.open ? 'caret-down' : 'caret-right'}
            onClick={event => {
              event.stopPropagation();
              event.preventDefault();
              onOpen(node, !node.open);
            }}
            fixedWidth={true}
          />
        </div>
      )}
      <div className={cx(block, grow)}>
        <div
          className={cx(
            flex,
            grow,
            isDirectory(node.file) &&
              dropZoneProps.isShallowOver &&
              dropZoneStyle,
            hoverRow,
            node.selected ? selectedRow : '',
          )}
          onClick={() => onSelectFile(node)}
        >
          <IconButton
            icon={getIconForFileType(node.file.mimeType)}
            fixedWidth={true}
          />
          <div className={cx(grow)}>{node.file.name}</div>
          <div className={flex}>
            {isDirectory(node.file) ? (
              <>
                <IconButton
                  icon={'folder-plus'}
                  tooltip={'Add new directory in folder'}
                  disabled={!isUploadAllowed(node)}
                  onClick={event => {
                    event.stopPropagation();
                    event.preventDefault();
                    addNewDirectory(node.file);
                    onOpen(node, true);
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
                  onClick={event => {
                    event.stopPropagation();
                    event.preventDefault();
                    openFile(node.file);
                  }}
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
              onClick={event => {
                event.stopPropagation();
                event.preventDefault();
                deleteFile(node);
              }}
              fixedWidth={true}
            />
          </div>
        </div>
        <div className={cx(block, grow)}>
          {isNodeDirectory(node) && node.open && children}
        </div>
      </div>
    </div>
  );
}
