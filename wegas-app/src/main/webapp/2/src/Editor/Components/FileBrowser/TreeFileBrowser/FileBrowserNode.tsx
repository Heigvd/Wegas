import * as React from 'react';
import { useDrop } from 'react-dnd';
import {
  dropSpecs,
  dropZoneStyle,
  isUploadAllowed,
  isDirectory,
  fileURL,
} from './FileBrowser';
import { IconButton } from '../../../../Components/Button/IconButton';
import { css, cx } from 'emotion';
import { themeVar } from '../../../../Components/Theme';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { generateAbsolutePath } from '../../../../API/files.api';

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
  file: IFileDescriptor;
  onFileClick: (file: IFileDescriptor) => void;
  addNewDirectory: (file: IFileDescriptor) => Promise<boolean>;
  deleteFile: (baseDir: IFileDescriptor) => void;
  insertFiles: (files: FileList, path?: string) => Promise<boolean>;
  uploadFiles: (
    targetFile: IFileDescriptor,
  ) => (event: React.ChangeEvent<HTMLInputElement>) => Promise<boolean>;
  selected?: boolean;
  defaultOpen?: boolean;
}

export function FileBrowserNode({
  file,
  onFileClick,
  addNewDirectory,
  deleteFile,
  insertFiles,
  uploadFiles,
  children,
  selected,
  defaultOpen,
}: React.PropsWithChildren<FileBrowserNodeProps>) {
  const [open, setOpen] = React.useState(defaultOpen);

  const uploader = React.useRef<HTMLInputElement>(null);

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
      insertFiles(files, generateAbsolutePath(file));
    }),
  );

  const timeoutBeforeExpend = 1000;

  React.useEffect(() => {
    let openTimeout: number | undefined;
    if (isDirectory(file)) {
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
  }, [dropZoneProps, file]);

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
        multiple={isDirectory(file)}
        className={hidden}
        onClick={event => {
          (event.target as HTMLInputElement).value = '';
        }}
        onChange={event => {
          uploadFiles(file)(event).then(succes => setOpen(succes));
        }}
      />
      {isDirectory(file) && (
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
          className={cx(
            flex,
            grow,
            isDirectory(file) && dropZoneProps.isShallowOver && dropZoneStyle,
            hoverRow,
            selected ? selectedRow : '',
          )}
          onClick={() => onFileClick(file)}
        >
          <IconButton
            icon={getIconForFileType(file.mimeType)}
            fixedWidth={true}
          />
          <div className={cx(grow)}>{file.name}</div>
          <div className={flex}>
            {isDirectory(file) ? (
              <>
                <IconButton
                  icon={'folder-plus'}
                  tooltip={'Add new directory in folder'}
                  disabled={!isUploadAllowed(file)}
                  onClick={event => {
                    event.stopPropagation();
                    event.preventDefault();
                    addNewDirectory(file).then(succes => setOpen(succes));
                  }}
                  fixedWidth={true}
                />
                <IconButton
                  icon={'file-upload'}
                  tooltip={'Upload file in the folder'}
                  disabled={!isUploadAllowed(file)}
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
                    openFile(file);
                  }}
                  fixedWidth={true}
                />
                <IconButton
                  icon={'file-import'}
                  tooltip={'Upload new version'}
                  disabled={!isUploadAllowed(file)}
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
                deleteFile(file);
              }}
              fixedWidth={true}
            />
          </div>
        </div>
        <div className={cx(block, grow)}>
          {isDirectory(file) && open && children}
        </div>
      </div>
    </div>
  );
}
