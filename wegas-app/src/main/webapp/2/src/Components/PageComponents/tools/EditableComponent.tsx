import * as React from 'react';
import { css, cx } from 'emotion';
import { dropZoneClass } from '../../Contexts/DefaultDndProvider';
import {
  DnDComponent,
  dndComponnent,
} from '../../../Editor/Components/Page/ComponentPalette';
import { useDrop, DropTargetMonitor } from 'react-dnd';
import { pageCTX } from '../../../Editor/Components/Page/PageEditor';
import { themeVar } from '../../Theme';
import { IconButton } from '../../Inputs/Button/IconButton';
import { ConfirmButton } from '../../Inputs/Button/ConfirmButton';
import { Toggler, TogglerProps } from '../../Inputs/Button/Toggler';
import List from '../../Layouts/List';
import { expand } from '../../../css/classes';
import { Centered } from '../../Layouts/Centered';

const editItemStyle = css({
  display: 'list-item',
  marginLeft: '10px',
});

interface ComponentEditorHandleProps {
  name: string;
  path: string[];
}

export interface EditorHandleProps {
  vertical?: boolean;
  className?: string;
  togglerProps?: TogglerProps;
}

export function ComponentEditorHandle({
  name,
  path,
}: ComponentEditorHandleProps) {
  return function EditHandle({
    vertical,
    className,
    togglerProps,
  }: EditorHandleProps) {
    const { editMode, showControls, onEdit, onDelete } = React.useContext(
      pageCTX,
    );
    return editMode && showControls ? (
      <div className={className}>
        <div
          className={cx(
            expand,
            css({ background: themeVar.primaryHoverColor }),
          )}
        >
          <Centered
            className={css({
              padding: '2px',
              width: 'fit-content',
              height: 'fit-content',
            })}
          >
            <List horizontal={!vertical} shrink centered>
              {name}
              <IconButton icon="edit" onClick={() => onEdit(path)} />
              <ConfirmButton
                icon="trash"
                onAction={success => {
                  if (success) {
                    onDelete(path);
                  }
                }}
              />
              {togglerProps && <Toggler {...togglerProps} />}
            </List>
          </Centered>
        </div>
      </div>
    ) : null;
  };
}

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
  children: (
    children: WegasComponent[],
    EditHandle: React.FunctionComponent<EditorHandleProps>,
    showBorders: boolean,
  ) => React.ReactElement | null;
  wegasChildren?: WegasComponent[];
  path: string[];
  uneditable?: boolean;
}

export function EditableComponent({
  componentName,
  children,
  wegasChildren,
  path,
  uneditable,
}: EditableComponentProps) {
  const { editMode: edit, onDrop, showBorders } = React.useContext(pageCTX);
  const editMode = edit && !uneditable;
  let content: WegasComponent[] = [];
  if (wegasChildren !== undefined) {
    content = editMode
      ? wegasChildren.reduce(
          (o, c, i) => [
            ...o,
            c,
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

  return children(
    content,
    uneditable
      ? () => null
      : ComponentEditorHandle({ name: componentName, path }),
    showBorders && !uneditable,
  );
}