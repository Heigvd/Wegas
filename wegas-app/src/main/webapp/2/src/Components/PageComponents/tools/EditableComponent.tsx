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
    visibility: 'hidden',
    opacity: 0.0,
    transition: 'visibility 0.5s, opacity 0.5s',
  },
  ':hover>.wegas-component-handle': {
    visibility: 'visible',
    opacity: 0.8,
    transition: 'opacity 0s',
  },
});

const handleContentStyle = css({
  borderRadius: themeVar.borderRadius,
  borderStyle: 'solid',
  borderColor: 'transparent',
  transition: 'border-color 0.5s',
  ':hover': {
    borderColor: themeVar.primaryLighterColor,
    transition: 'border-color 0s',
  },
  '&>.wegas-component-handle-title': {
    background: themeVar.primaryHoverColor,
    borderTopLeftRadius: themeVar.borderRadius,
    borderTopRightRadius: themeVar.borderRadius,
    opacity: 0.0,
    transition: 'visibility 0.5s, opacity 0.5s',
  },
  ':hover>.wegas-component-handle-title': {
    opacity: 1,
    transition: 'opacity 0s',
  },
  '&>.wegas-component-handle-content': {
    background: themeVar.primaryHoverColor,
    borderRadius: themeVar.borderRadius,
    borderTopLeftRadius: themeVar.borderRadius,
    transition: 'border-top-left-radius 0.5s, border-top-right-radius 0.5s',
  },
  ':hover>.wegas-component-handle-content': {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    transition: 'border-top-left-radius 0s, border-top-right-radius 0s',
  },
});

export const expandEditStyle = css({
  borderStyle: 'solid',
  borderWidth: '30px',
  borderColor: themeVar.disabledColor,
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

const flattenPath = (path: string[]) => {
  const purePath = [...path];
  let flatPath = '';
  while (purePath.length) {
    flatPath = '/' + purePath.pop() + flatPath;
  }
  return flatPath === '' ? '/' : flatPath;
};

const visitPath = (path: string[], callback: (path: string[]) => void) => {
  const purePath = [...path];
  do {
    callback(purePath);
    purePath.pop();
  } while (purePath.length > 0);
};

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
  const {
    editMode,
    showControls,
    handles,
    onEdit,
    onDelete,
  } = React.useContext(pageCTX);
  function EditHandle({
    componentName,
    className,
    togglerProps,
  }: EditorHandleProps) {
    const [stackedHandles, setStackedHandles] = React.useState<JSX.Element[]>();
    const [, drag] = useComponentDrag(type, path);
    const handleRef = React.createRef<HTMLDivElement>();

    const HandleContent = React.forwardRef<HTMLDivElement>((_, ref) => {
      return (
        <div
          style={{ display: 'flex', flexDirection: 'column' }}
          ref={ref}
          className={handleContentStyle}
        >
          <div
            style={{ fontSize: '10px' }}
            className={
              cx(flex, flexRow, textCenter) + ' wegas-component-handle-title'
            }
          >
            {(componentName ? componentName + ' : ' : '') + type}
          </div>
          <div
            className={cx(flex, flexRow) + ' wegas-component-handle-content'}
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
      );
    });

    handles[flattenPath(path)] = { jsx: <HandleContent />, dom: handleRef };
    return editMode && showControls ? (
      <div
        style={{
          position: 'absolute',
          top: '-30px',
          left: '-30px',
        }}
        className={'wegas-component-handle ' + (className ? className : '')}
        onMouseEnter={() => {
          const computedHandles: JSX.Element[] = [];
          const currentHandle = handles[flattenPath(path)];
          if (currentHandle.dom.current) {
            const {
              x: cx,
              y: cy,
            } = currentHandle.dom.current.getBoundingClientRect();
            computedHandles.push(currentHandle.jsx);
            const trimmedPath = path.slice(0, -1);
            visitPath(trimmedPath, visitedPath => {
              const component = handles[flattenPath(visitedPath)];
              if (component.dom.current) {
                const { x, y } = component.dom.current.getBoundingClientRect();
                if (x === cx && y === cy) {
                  computedHandles.splice(0, 0, component.jsx);
                }
              }
            });
          }
          setStackedHandles(computedHandles);
        }}
        onMouseLeave={() => setStackedHandles(undefined)}
      >
        {stackedHandles ? stackedHandles : <HandleContent ref={handleRef} />}
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
            [expandEditStyle]:
              editMode && showControls && isLayout && path.length === 0,
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
