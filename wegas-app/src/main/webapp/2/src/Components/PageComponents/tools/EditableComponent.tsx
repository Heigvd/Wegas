import * as React from 'react';
import { css, cx } from 'emotion';
import { dropZoneClass } from '../../Contexts/DefaultDndProvider';
import {
  DnDComponent,
  dndComponnent,
  useComponentDrag,
} from '../../../Editor/Components/Page/ComponentPalette';
import { useDrop, DropTargetMonitor } from 'react-dnd';
import { pageCTX } from '../../../Editor/Components/Page/PageEditor';
import { themeVar } from '../../Theme';
import { flex, flexRow, textCenter } from '../../../css/classes';
import { ConfirmButton } from '../../Inputs/Buttons/ConfirmButton';
import { IconButton } from '../../Inputs/Buttons/IconButton';
import { TogglerProps } from '../../Inputs/Boolean/Toggler';
import { FlexItemProps, FlexItem } from '../../Layouts/FlexList';
import { ErrorBoundary } from '../../../Editor/Components/ErrorBoundary';
import { useDebounce } from '../../Hooks/useDebounce';
import { CheckBox } from '../../Inputs/Boolean/CheckBox';

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
  '&>*>*': childHighlightCSS,
});

const handleControlStyle = css({
  '&>.wegas-component-handle': {
    visibility: 'collapse',
    opacity: 0.0,
    transition: 'visibility 2s, opacity 2s',
  },
  ':hover>.wegas-component-handle': {
    visibility: 'visible',
    opacity: 0.8,
    transition: 'opacity 0s',
  },
});

export const expandEditStyle = css({
  padding: '30px',
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
  isLayout?: boolean;
}

export function ComponentEditorContainer({
  type,
  path,
}: ComponentEditorContainerProps) {
  const { editMode, showControls, onEdit, onDelete } = React.useContext(
    pageCTX,
  );
  function EditHandle({
    componentName,
    className,
    togglerProps,
  }: EditorHandleProps) {
    const [, drag] = useComponentDrag(type, path);
    return editMode && showControls ? (
      <div
        style={{
          position: 'absolute',
          top: '-30px',
          left: '-30px',
          display: 'flex',
          flexDirection: 'column',
        }}
        className={'wegas-component-handle ' + (className ? className : '')}
      >
        <div
          style={{ fontSize: '10px' }}
          className={cx(flex, flexRow, textCenter)}
        >
          {(componentName ? componentName + ' : ' : '') + type}
        </div>
        <div
          style={{
            borderRadius: themeVar.borderRadius,
            background: themeVar.primaryHoverColor,
          }}
          className={cx(flex, flexRow)}
        >
          <IconButton icon="edit" onClick={() => onEdit(path)} />
          <IconButton icon="arrows-alt" ref={drag} />
          <ConfirmButton
            icon="trash"
            onAction={success => {
              if (success) {
                onDelete(path);
              }
            }}
          />
          {togglerProps && <CheckBox {...togglerProps} />}
        </div>
      </div>
    ) : null;
  }
  return function ComponentContainer({
    children,
    flexProps,
    handleProps,
    showBorders,
    isLayout,
  }: React.PropsWithChildren<ComponentContainerProps>) {
    return (
      <FlexItem
        {...flexProps}
        className={cx(
          handleControlStyle,
          {
            [childHighlightStyle]: showBorders,
            [layoutHighlightStyle]: showBorders,
            [expandEditStyle]: editMode && showControls && isLayout,
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
  const show = useDebounce(dropZoneProps.canDrop, 100);

  return (
    <>
      {show && (
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
