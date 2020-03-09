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
import List from '../../Layouts/List';
import { expandBoth } from '../../../css/classes';
import { Centered } from '../../Layouts/Centered';
import { ConfirmButton } from '../../Inputs/Buttons/ConfirmButton';
import { IconButton } from '../../Inputs/Buttons/IconButton';
import { Toggler, TogglerProps } from '../../Inputs/Boolean/Toggler';
import { FlexItemProps, FlexItem } from '../../Layouts/FlexList';
import { ErrorBoundary } from '../../../Editor/Components/ErrorBoundary';

export const layoutHighlightStyle = css({
  borderStyle: 'solid',
  borderWidth: '2px',
  borderColor: themeVar.searchColor,
});

export const childHighlightCSS = {
  borderStyle: 'dotted',
  borderWidth: '1px',
  borderColor: themeVar.searchColor,
};

export const childHighlightStyle = css({
  '&>*': childHighlightCSS,
});

const editItemStyle = css({
  display: 'list-item',
  marginLeft: '10px',
  width: '100px',
  height: '100px',
});

interface ComponentEditorContainerProps {
  type: string;
  path: string[];
}

export interface EditorHandleProps {
  componentName?: string;
  vertical?: boolean;
  showHandle?: boolean;
  opacity?: number;
  className?: string;
  togglerProps?: TogglerProps;
}

export interface PageComponentMandatoryProps extends FlexItemProps {
  /**
   * ComponentContainer - the container that must surround any component
   */
  ComponentContainer: React.FunctionComponent<ComponentContainerProps>;
  /**
   * displayBorders - ask the component to highlight its borders
   */
  showBorders?: boolean;
  /**
   * path - the location of the component in the page
   */
  path?: string[];
}

function Nothing() {
  return null;
}

const defaultMandatoryProps: PageComponentMandatoryProps = {
  ComponentContainer: Nothing,
  showBorders: undefined,
  path: [],
};

export const defaultMandatoryKeys = Object.keys(defaultMandatoryProps);

export interface ComponentContainerProps
  extends Omit<PageComponentMandatoryProps, 'ComponentContainer'> {
  flexProps: FlexItemProps;
  handleProps?: EditorHandleProps;
}

export function ComponentEditorContainer({
  type,
  path,
}: ComponentEditorContainerProps) {
  function EditHandle({
    componentName,
    vertical,
    className,
    togglerProps,
  }: EditorHandleProps) {
    const { editMode, showControls, onEdit, onDelete } = React.useContext(
      pageCTX,
    );
    return editMode && showControls ? (
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: vertical ? 0 : undefined,
          left: vertical ? undefined : 0,
          borderRadius: themeVar.borderRadius,
          background: themeVar.primaryHoverColor,
          // opacity: showHandle ? opacity : 0.0,
        }}
        className={'wegas-component-handle ' + (className ? className : '')}
      >
        <div className={expandBoth}>
          <Centered
            className={css({
              padding: '2px',
              width: 'fit-content',
              height: 'fit-content',
            })}
          >
            <List horizontal={!vertical} shrink centered>
              {(componentName ? componentName + ' : ' : '') + type}
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
  }
  return function ComponentContainer({
    children,
    flexProps,
    handleProps,
    showBorders,
  }: React.PropsWithChildren<ComponentContainerProps>) {
    return (
      <FlexItem
        {...flexProps}
        className={cx(
          {
            [childHighlightStyle]: showBorders,
            [layoutHighlightStyle]: showBorders,
          },
          flexProps.className,
        )}
        style={flexProps.style}
      >
        {path.length > 0 && <EditHandle {...handleProps} />}
        <ErrorBoundary>{children}</ErrorBoundary>
      </FlexItem>
    );
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
  children?: JSX.Element[];
  path: string[];
}

interface EditableComponentProps {
  componentName: string;
  children: (
    children: JSX.Element[],
    ComponentContainer: React.FunctionComponent<ComponentContainerProps>,
    showBorders: boolean,
  ) => React.ReactElement | null;
  wegasChildren?: JSX.Element[];
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
  let content: JSX.Element[] = [];
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
      : ComponentEditorContainer({ type: componentName, path }),
    showBorders && !uneditable,
  );
}
