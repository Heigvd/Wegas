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
import { IFile } from '../../../../types/IFile';

const dndHover = css({
  borderWidth: '1pt',
  borderStyle: 'Solid',
  borderColor: 'blue',
  backgroundColor: 'lightblue',
});

const rowCell = css({
  borderWidth: '1pt',
  borderStyle: 'Solid',
});

const uploadCell = css({
  borderWidth: '2pt',
  borderStyle: 'Dashed',
  borderColor: 'blue',
  textAlign: 'center',
});

export const hiddenFileBrowserStyle = css({
  visibility: 'hidden',
  width: 0,
  height: 0,
  position: 'absolute',
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
  onClick: (file: IFile) => void;
  onSelect: (file: IFile, toggle: boolean) => void;
  callRefresh: () => void;
  selected: boolean;
}
export interface DndFileRowProps extends FileRowProps, DndTargetProps {
  onDrop: (props: DndFileRowProps, monitor: DropTargetMonitor) => void;
}
interface DndTargetFileRowProps extends DndFileRowProps, DndProps {}

interface AddFileRowProps {
  onClick: (event: React.MouseEvent) => void;
}
export interface DndAddFileRowProps extends AddFileRowProps, DndTargetProps {
  onDrop: (props: DndAddFileRowProps, monitor: DropTargetMonitor) => void;
}

interface DndTargetAddFileRowProps extends DndAddFileRowProps, DndProps {}

function FileRow(props: FileRowProps) {
  const [selected, setSelected] = React.useState(props.selected);
  const [absoluteFileName, setAbsoluteFileName] = React.useState('');
  const select = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected(!selected);
    props.onSelect(props.file, !selected);
  };
  const watch = (e: React.MouseEvent) => {
    e.stopPropagation();
    const win = window.open(
      API_ENDPOINT +
        `GameModel/${
          GameModel.selectCurrent().id
        }/File/read${absoluteFileName}`,
      '_blank',
    );
    win!.focus();
  };

  const del = (e: React.MouseEvent) => {
    e.stopPropagation();
    FileAPI.deleteFile(GameModel.selectCurrent().id!, absoluteFileName)
      // .then((res: IFile) => {
      //   console.log(res);
      // })
      .then(() => {
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

  React.useEffect(() => {
    setSelected(props.selected);
    let filePath = props.file.path;
    if (filePath.substr(-1, 1) === '/') {
      filePath = filePath.substr(0, filePath.length - 1);
    }
    filePath += '/' + props.file.name;
    setAbsoluteFileName(filePath);
  }, [props]);

  return (
    <>
      <td className={rowCell} onClick={select}>
        <FontAwesome icon={selected ? 'check-square' : 'square'} />
      </td>
      <td className={rowCell}>
        <FontAwesome icon={props.file.directory ? 'folder' : 'file'} />
      </td>
      <td className={rowCell}>{props.file.name}</td>
      <td className={rowCell}>{props.file.bytes}</td>
      <td className={rowCell}>{props.file.mimeType}</td>
      <td className={rowCell} onClick={del}>
        <FontAwesome icon="trash" />
      </td>
      {!props.file.directory && (
        <td className={rowCell} onClick={clickEdit}>
          <FontAwesome icon="edit" />
          <input
            type="file"
            onChange={edit}
            className={hiddenFileBrowserStyle}
          />
        </td>
      )}
      {!props.file.directory && (
        <td className={rowCell} onClick={watch}>
          <FontAwesome icon="search" />
        </td>
      )}
    </>
  );
}

const DndFileRow: React.FC<DndTargetFileRowProps> = (
  props: DndTargetFileRowProps,
) => {
  const isActive: boolean = props.canDrop && props.isOver;
  return props.connectDropTarget(
    <tr
      onClick={() => {
        props.onClick(props.file);
      }}
      className={isActive ? dndHover : undefined}
    >
      <FileRow
        file={props.file}
        onClick={props.onClick}
        onSelect={props.onSelect}
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

export function AddFileRow(props: AddFileRowProps) {
  return (
    <td
      onClick={props.onClick}
      className={uploadCell}
      colSpan={Number.MAX_SAFE_INTEGER}
    >
      {' '}
      Drag file or click there to upload{' '}
    </td>
  );
}

const DndAddFileRow: React.FC<DndTargetAddFileRowProps> = (
  props: DndTargetAddFileRowProps,
) => {
  console.log(props.accepts);
  const isActive: boolean = props.canDrop && props.isOver;
  return props.connectDropTarget(
    <tr className={isActive ? dndHover : undefined}>
      <AddFileRow onClick={props.onClick} />
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
