import * as React from 'react';
import { css, cx } from 'emotion';
import {
  dropZoneFocusCss,
  dropZoneClass,
} from '../Contexts/DefaultDndProvider';
import { themeVar } from '../Theme';
import {
  DnDComponent,
  dndComponnent,
} from '../../Editor/Components/Page/ComponentPalette';
import { useDrop, DropTargetMonitor } from 'react-dnd';
import { IconButton } from '../Inputs/Button/IconButton';
import { ConfirmButton } from '../Inputs/Button/ConfirmButton';
import { pageCTX } from '../../Editor/Components/Page/PageEditor';

const editListStyle = css({
  ...dropZoneFocusCss,
  borderColor: themeVar.searchColor,
  padding: '10px',
});

const editItemStyle = css({
  display: 'list-item',
  marginLeft: '10px',
});

interface ComponentDropZoneProps {
  onDrop?: (dndComponnent: DnDComponent) => void;
}

function ComponentDropZone({ onDrop }: ComponentDropZoneProps) {
  const [dropZoneProps, dropZone] = useDrop({
    accept: dndComponnent,
    canDrop: () => true,
    drop: onDrop,
    collect: (mon: DropTargetMonitor) => ({
      isOverCurrent: mon.isOver({ shallow: true }),
      canDrop: mon.canDrop(),
      item: mon.getItem() as DnDComponent | null,
    }),
  });
  return (
    <>
      {dropZoneProps.canDrop && (
        <div className={editItemStyle}>
          <div
            ref={dropZone}
            className={dropZoneClass(dropZoneProps.isOverCurrent)}
          >
            Drop component here
          </div>
        </div>
      )}
    </>
  );
}

export interface PageComponentProps {
  children?: WegasComponent[];
  path: string[];
}

interface EditableComponentProps {
  componentName: string;
  children: (children: WegasComponent[]) => React.ReactElement | null;
  wegasChildren?: WegasComponent[];
  path: string[];
}

export function EditableComponent({
  componentName,
  children,
  wegasChildren,
  path,
}: EditableComponentProps) {
  const { editMode, onDrop, onDelete, onEdit } = React.useContext(pageCTX);
  let content: WegasComponent[] = [];
  if (wegasChildren !== undefined) {
    content = editMode
      ? wegasChildren.reduce(
          (o, c, i) => [
            ...o,
            <div key={i} className={editItemStyle}>
              {c}
            </div>,
            <ComponentDropZone
              key={i + 'AFTER'}
              onDrop={c => onDrop && onDrop(c, path, i + 1)}
            />,
          ],
          [
            <ComponentDropZone
              key={'FIRST'}
              onDrop={c => onDrop && onDrop(c, path, 0)}
            />,
          ],
        )
      : wegasChildren;
  }

  return (
    <div
      className={cx({
        [editListStyle]: editMode,
      })}
    >
      {editMode && (
        <div>
          {componentName}
          <IconButton icon="edit" onClick={() => onEdit && onEdit(path)} />
          <ConfirmButton
            icon="trash"
            onAction={success => {
              if (success && onDelete) {
                onDelete && onDelete(path);
              }
            }}
          />
        </div>
      )}
      {children(content)}
    </div>
  );
}
