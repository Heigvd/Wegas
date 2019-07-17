import * as React from 'react';
import { FileAPI } from '../../../../API/files.api';
import { useDrop } from 'react-dnd';
import {
  dropSpecs,
  hiddenFileBrowserStyle,
  dropZoneStyle,
  isUploadAllowed,
  generateGoodPath,
  isDirectory,
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
  selectFile: (file: FileNode) => void;
  addNewDirectory: (file: IFileDescriptor) => void;
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
    selectFile,
    addNewDirectory,
    deleteFile,
    insertFiles,
    uploadFiles,
    children,
  } = props;

  const [open, setOpen] = React.useState(node.open);

  const uploader = React.useRef<HTMLInputElement>(null);

  const openFile = (file: IFileDescriptor) => {
    const win = window.open(FileAPI.fileURL(generateGoodPath(file)), '_blank');
    win!.focus();
  };

  const [dropZoneProps, dropZone] = useDrop(
    dropSpecs(item => {
      const { files } = (item as unknown) as {
        files: FileList;
        items: DataTransferItemList;
      };
      insertFiles(files, generateGoodPath(node.file));
      setOpen(true);
    }),
  );

  const timeoutBeforeExpend = 1000;

  React.useEffect(() => {
    let openTimeout: number | undefined;
    if (isDirectory(node.file)) {
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
  }, [dropZoneProps, node]);

  const addNewFile = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
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
        onClick={event => {
          (event.target as HTMLInputElement).value = '';
        }}
        onChange={event => {
          uploadFiles(node)(event);
          setOpen(true);
        }}
      />

      {isNodeDirectory(node) && (
        <IconButton
          icon={open ? 'caret-down' : 'caret-right'}
          onClick={event => {
            event.stopPropagation();
            event.preventDefault();
            setOpen(oldOpen => !oldOpen);
          }}
          className={css({ float: 'left', height: 'fit-content' })}
          fixedWidth={true}
        />
      )}
      <div style={{ flex: '1 1 auto' }}>
        <div
          ref={dropZone}
          className={cx(
            isDirectory(node.file) &&
              dropZoneProps.isShallowOver &&
              dropZoneStyle,
            hoverRow,
            node.selected ? selectedRow : '',
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
                  onClick={event => {
                    event.stopPropagation();
                    event.preventDefault();
                    addNewDirectory(node.file);
                    setOpen(true);
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
          </span>
        </div>
        {isNodeDirectory(node) && open && <div>{children}</div>}
      </div>
    </div>
  );
}
