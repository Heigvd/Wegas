import { css } from 'emotion';
import {
  DropTargetMonitor,
  ConnectDropTarget,
  DropTarget,
  DropTargetConnector,
} from 'react-dnd';
import * as React from 'react';
import { GameModel } from '../../../data/selectors';
import { FontAwesome } from '../Views/FontAwesome';
import { FileAPI } from '../../../API/files.api';
import { themeVar } from '../../../Components/Theme';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { gameModelDependsOnModel } from './FileBrowser';

const dndRow = css({
  color: themeVar.primaryLighterColor,
  // backgroundColor: themeVar.primaryLighterColor,
});

const dndHover = css({
  color: themeVar.primaryLighterTextColor,
  backgroundColor: themeVar.primaryLighterColor,
});

const uploadingStyle = css({
  backgroundColor: themeVar.successColor,
});

const rowCell = css({
  // color: themeVar.primaryLighterColor,
  borderColor: 'black',
  borderWidth: '1pt',
  borderStyle: 'Solid',
});

const uploadCell = css({
  color: themeVar.primaryLighterColor,
  borderWidth: '2pt',
  borderStyle: 'Dashed',
  borderColor: themeVar.primaryLighterColor,
  textAlign: 'center',
});

export const hiddenFileBrowserStyle = css({
  display: 'none',
});

interface DndProps {
  isOver: boolean;
  canDrop: boolean;
  connectDropTarget: ConnectDropTarget;
}
interface DndTargetProps {
  accepts: string[];
  onDrop: (props: DndTargetProps, monitor: DropTargetMonitor) => void;
}

interface FileRowProps {
  file: IFile;
  onSelect: (file: IFile, toggle?: boolean) => void;
  onOpen: (file: IFile) => void;
  callRefresh: () => void;
  selected?: boolean;
}

export interface DndFileRowProps extends FileRowProps, DndTargetProps {
  onDrop: (props: DndFileRowProps, monitor: DropTargetMonitor) => void;
}
interface DndTargetFileRowProps extends DndFileRowProps, DndProps {}

interface AddFileRowProps {
  isUploading: boolean;
}

export interface DndAddFileRowProps extends AddFileRowProps, DndTargetProps {
  onClick: (event: React.MouseEvent) => void;
  onDrop: (props: DndAddFileRowProps, monitor: DropTargetMonitor) => void;
}

interface DndTargetAddFileRowProps extends DndAddFileRowProps, DndProps {}

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

export const getAbsoluteFileName = (file: IFile) => {
  let filePath = file.path;
  if (filePath.substr(-1, 1) === '/') {
    filePath = filePath.substr(0, filePath.length - 1);
  }
  filePath += '/' + file.name;
  return filePath;
};

const FileRow = (props: FileRowProps) => {
  const isEditAllowed = () => {
    return !gameModelDependsOnModel() || props.file.visibility === 'PRIVATE';
  };

  const del = (e: React.MouseEvent) => {
    e.stopPropagation();
    FileAPI.deleteFile(
      GameModel.selectCurrent().id!,
      getAbsoluteFileName(props.file),
    ).then(() => {
      props.callRefresh();
    });
  };

  // https://stackoverflow.com/questions/8595389/programmatically-trigger-select-file-dialog-box
  const clickEdit = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.currentTarget.getElementsByTagName('input')[0].click();
  };

  const edit = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    if (event.target.files !== null && event.target.files[0]) {
      FileAPI.createFile(
        GameModel.selectCurrent().id!,
        props.file.name,
        props.file.path,
        event.target.files[0],
        true,
      ).then(() => {
        props.callRefresh();
      });
    }
  };

  return (
    <>
      <td className={rowCell}>
        <FontAwesome icon={getIconForFileType(props.file.mimeType)} />
      </td>
      <td className={rowCell}>{props.file.name}</td>
      {/* {showFields.size && <td className={rowCell}>{props.file.bytes}</td>}
      {showFields.type && <td className={rowCell}>{props.file.mimeType}</td>} */}
      <td className={rowCell}>
        <span
          onClick={(event: React.MouseEvent) => {
            event.stopPropagation();
            props.onOpen(props.file);
          }}
        >
          <FontAwesome icon="search" />
        </span>
        {!props.file.directory && isEditAllowed() && (
          <span onClick={clickEdit}>
            <FontAwesome icon="edit" />
            <input
              type="file"
              onChange={edit}
              className={hiddenFileBrowserStyle}
            />
          </span>
        )}
        {isEditAllowed() && (
          <span onClick={del}>
            <FontAwesome icon="trash" />
          </span>
        )}
      </td>
    </>
  );
};

const DndFileRow: React.FC<DndTargetFileRowProps> = (
  props: DndTargetFileRowProps,
) => {
  const isActive: boolean = props.canDrop && props.isOver;
  const [selected, setSelected] = React.useState(props.selected);
  const select = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected(!selected);
    props.onSelect(props.file, !selected);
  };

  React.useEffect(() => {
    setSelected(props.selected);
  }, [props]);

  return props.connectDropTarget(
    <tr onClick={select} className={isActive || selected ? dndHover : dndRow}>
      <FileRow
        file={props.file}
        onSelect={props.onSelect}
        onOpen={props.onOpen}
        callRefresh={props.callRefresh}
        selected={props.selected}
      />
    </tr>,
  );
};

export const DropTargetFileRow = DropTarget(
  (props: DndFileRowProps) => props.accepts,
  {
    drop(props: DndFileRowProps, monitor: DropTargetMonitor) {
      if (props.onDrop) {
        props.onDrop(props, monitor);
      }
    },
  },
  (connect: DropTargetConnector, monitor: DropTargetMonitor) => ({
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop(),
  }),
)(DndFileRow);

export const AddFileRow = (props: AddFileRowProps) => {
  return (
    <td className={uploadCell} colSpan={Number.MAX_SAFE_INTEGER}>
      {props.isUploading
        ? "You're currently uploading files"
        : 'Drag file or click there to upload'}
    </td>
  );
};

const DndAddFileRow: React.FC<DndTargetAddFileRowProps> = (
  props: DndTargetAddFileRowProps,
) => {
  const isActive: boolean = props.canDrop && props.isOver;
  const className = props.isUploading
    ? uploadingStyle
    : isActive
    ? dndHover
    : undefined;
  return props.connectDropTarget(
    <tr className={className} onClick={props.onClick}>
      <AddFileRow isUploading={props.isUploading} />
    </tr>,
  );
};

export const DropTargetAddFileRow = DropTarget(
  (props: DndAddFileRowProps) => props.accepts,
  {
    drop(props: DndAddFileRowProps, monitor: DropTargetMonitor) {
      if (props.onDrop) {
        props.onDrop(props, monitor);
      }
    },
  },
  (connect: DropTargetConnector, monitor: DropTargetMonitor) => ({
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop(),
  }),
)(DndAddFileRow);
