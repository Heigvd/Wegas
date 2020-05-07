import * as React from 'react';
import { css, cx } from 'emotion';
import { dropZoneClass } from '../../Contexts/DefaultDndProvider';
import {
  DnDComponent,
  PAGEEDITOR_COMPONENT_TYPE,
} from '../../../Editor/Components/Page/ComponentPalette';
import { useDrop, DropTargetMonitor, DragElementWrapper } from 'react-dnd';
import { pageCTX, Handles } from '../../../Editor/Components/Page/PageEditor';
import { themeVar } from '../../Theme';
import { flex } from '../../../css/classes';
import { FlexItem, FlexListProps } from '../../Layouts/FlexList';
import { ErrorBoundary } from '../../../Editor/Components/ErrorBoundary';
import { useDebounce } from '../../Hooks/useDebounce';
import { omit } from 'lodash-es';
import { classNameOrEmpty } from '../../../Helper/className';
import { Content, Splitter, ContainerProps } from '../../Layouts/FonkyFlex';
import {
  pagesStateStore,
  usePagesStateStore,
  isComponentFocused,
  PageStateAction,
} from '../../../data/pageStore';
import {
  WegasComponentOptionsActions,
  WegasComponentActionsProperties,
  WegasComponentUpgrades,
  wegasComponentActions,
  WegasComponentActions,
  WegasComponentOptionsAction,
} from './options';
import { AbsoluteItem } from '../../Layouts/Absolute';
import { InfoBeam } from './InfoBeam';
import { EditHandle } from './EditHandle';
import { schemaProps } from './schemaProps';
import { useStore } from '../../../data/store';

// Styles
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

const childHighlightStyle = css({
  '&>*>*': childHighlightCSS,
});

const childDropZoneIntoCSS = {
  '&>*>*>.component-dropzone-into': {
    width: '100%',
    height: '100%',
  },
};

const childDropzoneHorizontalStyle = css({
  ...childDropZoneIntoCSS,
  '&>*>*>.component-dropzone': {
    maxWidth: '30px',
    width: '30%',
    height: '100%',
  },
  '&>*>*>.component-dropzone-after': {
    right: 0,
  },
});

const childDropzoneVerticalStyle = css({
  ...childDropZoneIntoCSS,
  '&>*>*>.component-dropzone': {
    maxHeight: '30px',
    width: '100%',
    height: '30%',
  },
  '&>*>*>.component-dropzone-after': {
    bottom: 0,
  },
});

const handleControlStyle = css({
  textAlign: 'center',
  '&>.wegas-component-handle': {
    visibility: 'hidden',
    opacity: 0.0,
  },
  ':hover>.wegas-component-handle': {
    visibility: 'unset',
    opacity: 0.8,
  },
});

const lockedStyle = css({
  opacity: 0.5,
  backgroundColor: themeVar.disabledColor,
});

const componentBorderCss = {
  borderStyle: 'solid',
  borderWidth: '1px',
  borderColor: themeVar.primaryHoverColor,
};

const focusedComponentStyle = css({
  backgroundColor: themeVar.primaryHoverColor,
});

const handleControlHoverStyle = css({
  ':hover': componentBorderCss,
});

// Helper functions

/**
 * visitPath - this function will a tree following a path and trigger a callback at each node
 * @param path - the path to visit
 * @param callback - the callback to call
 */
const visitPath = (path: number[], callback: (path: number[]) => void) => {
  const purePath = [...path];
  do {
    callback(purePath);
    purePath.pop();
  } while (purePath.length > 0);
};

/**
 * checkIfInsideRectangle - this function checks if a point is inside a rectangle
 * @param A - The top-left point of the rectangle
 * @param C - The bottom-right point of the rectangle
 * @param Ptest - The point to test
 */
const checkIfInsideRectangle = (
  A: { x: number; y: number },
  C: { x: number; y: number },
  Ptest: { x: number; y: number },
) => Ptest.x >= A.x && Ptest.x <= C.x && Ptest.y >= A.y && Ptest.y <= C.y;

/**
 * useDndComponentDrop - it's a hook that normalize the usage of useDrop in the different dropable zone used in this file
 * @param onDrop - the function to trigger when a drop occures
 */
function useDndComponentDrop(
  onDrop?: (dndComponnent: DnDComponent, dndMonitor: DropTargetMonitor) => void,
): [
  {
    isOver: boolean;
    isOverCurrent: boolean;
    canDrop: boolean;
    item: DnDComponent | null;
  },
  DragElementWrapper<{}>,
] {
  const [dropZoneProps, dropZone] = useDrop({
    accept: PAGEEDITOR_COMPONENT_TYPE,
    canDrop: () => true,
    drop: onDrop,
    collect: (mon: DropTargetMonitor) => ({
      isOver: mon.isOver({ shallow: false }),
      isOverCurrent: mon.isOver({ shallow: true }),
      canDrop: mon.canDrop(),
      item: mon.getItem() as DnDComponent | null,
    }),
  });
  const delayedCanDrop = useDebounce(dropZoneProps.canDrop, 100);
  return [{ ...dropZoneProps, canDrop: delayedCanDrop }, dropZone];
}

/**
 * computeHandles - this functions look for every visible handles and stack them
 * @param handles
 * @param path
 * @returns a list of handles that are overlapsing each others
 * @affects this function also hide the handles that are overlapsing
 */
function computeHandles(handles: Handles, path: number[]) {
  const computedHandles: JSX.Element[] = [];
  const currentHandle = handles[JSON.stringify(path)];
  if (currentHandle?.dom.current) {
    const {
      x: cx,
      y: cy,
      width: cw,
      height: ch,
    } = currentHandle.dom.current.getBoundingClientRect();
    const [A1, B1, C1, D1] = [
      { x: cx, y: cy },
      { x: cx, y: cy + ch },
      { x: cx + cw, y: cy + ch },
      { x: cx + cw, y: cy },
    ];
    computedHandles.push(currentHandle.jsx);
    const trimmedPath = path.slice(0, -1);
    visitPath(trimmedPath, visitedPath => {
      const component = handles[JSON.stringify(visitedPath)];
      if (component?.dom.current) {
        const {
          x,
          y,
          width: w,
          height: h,
        } = component.dom.current.getBoundingClientRect();
        const [A2, B2, C2, D2] = [
          { x: x, y: y },
          { x: x, y: y + h },
          { x: x + w, y: y + h },
          { x: x + w, y: y },
        ];
        const [A1in, B1in, C1in, D1in] = [
          checkIfInsideRectangle(A2, C2, A1),
          checkIfInsideRectangle(A2, C2, B1),
          checkIfInsideRectangle(A2, C2, C1),
          checkIfInsideRectangle(A2, C2, D1),
        ];
        const [A2in, B2in, C2in, D2in] = [
          checkIfInsideRectangle(A1, C1, A2),
          checkIfInsideRectangle(A1, C1, B2),
          checkIfInsideRectangle(A1, C1, C2),
          checkIfInsideRectangle(A1, C1, D2),
        ];
        if (A1in || B1in || C1in || D1in || A2in || B2in || C2in || D2in) {
          component.dom.current.style.setProperty('opacity', '0.0');
          computedHandles.splice(0, 0, component.jsx);
        } else {
          component.dom.current.style.setProperty('opacity', null);
        }
      }
    });
  }
  return computedHandles;
}

// Components

interface ComponentDropZoneProps {
  /**
   * onDrop - the called function when an authorized element is dropped on the zone
   */
  onDrop?: (dndComponnent: DnDComponent, dndMonitor: DropTargetMonitor) => void;
  /**
   * show - show the zone, hidden by default
   */
  show?: boolean;
  /**
   * dropPosition - defines the position of the dropzone in a component
   * left or top for AFTER, right or bottom for BEFORE and over for INTO
   */
  dropPosition: 'BEFORE' | 'AFTER' | 'INTO';
}

function ComponentDropZone({
  onDrop,
  show,
  dropPosition,
}: ComponentDropZoneProps) {
  const [{ isOverCurrent }, dropZone] = useDndComponentDrop(onDrop);
  return (
    <div
      ref={dropZone}
      className={
        dropZoneClass(isOverCurrent) +
        (dropPosition === 'INTO'
          ? ' component-dropzone-into'
          : ' component-dropzone') +
        (dropPosition === 'AFTER' ? ' component-dropzone-after' : '')
      }
      style={{
        visibility: show ? 'visible' : 'collapse',
        position: 'absolute',
      }}
    />
  );
}

interface LockedOverlayProps {
  locked: boolean;
}

function LockedOverlay({ locked }: LockedOverlayProps) {
  return locked ? (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
      }}
    ></div>
  ) : null;
}

/**
 * WegasComponentItemProps - Required props for a layout item component
 */
export interface WegasComponentItemProps extends ClassAndStyle {
  /**
   * onClick - triggered when a click occures on the element
   */
  onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  /**
   * onMouseOver - triggered when the mouse is over the element
   */
  onMouseOver?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  /**
   * onMouseLeave - trigered when the mouse is no more over the element
   */
  onMouseLeave?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  /**
   * tooltip - a descriptive text that apprear when the cursor is idle over the element
   */
  tooltip?: string;
}

/**
 * ContainerTypes - the types of layouts that can be used in a page
 */
export type ContainerTypes = 'FLEX' | 'LINEAR' | 'ABSOLUTE' | undefined;

/**
 * PageComponentProps - The props that are needed by the ComponentContainer
 */
export interface PageComponentProps {
  /**
   * componentType - The type of component
   */
  componentType: string;
  /**
   * path - the path of the current component
   */
  path: number[];
  /**
   * childrenType - the item type of the component
   */
  childrenType: ContainerTypes;
  /**
   * containerType - the container type of the component
   */
  containerType: ContainerTypes;
  /**
   * last - is this component the last of the list
   */
  last?: boolean;
  /**
   * noHandle - if set, the component will not show a handle
   */
  noHandle?: boolean;
}

/**
 * WegasComponentProps - Required props for a Wegas component
 */
export interface WegasComponentProps
  extends React.PropsWithChildren<ClassAndStyle>,
    PageComponentProps {
  /**
   * name - The name of the component in the page
   */
  name?: string;
  /**
   * options - Various options that can be defined on every component of a page
   */
  options?: {
    actions?: WegasComponentOptionsActions & WegasComponentActionsProperties;
    upgrades?: WegasComponentUpgrades;
    [options: string]: unknown;
  };
}

/**
 * wegasComponentCommonSchema - defines the minimum schema for every WegasComponent
 */
export const wegasComponentCommonSchema = {
  name: schemaProps.string('Name', false, undefined, undefined, -1),
  className: schemaProps.string(
    'Classes',
    false,
    undefined,
    undefined,
    1001,
    undefined,
    true,
  ),
  // style: schemaProps.code('Style', false, 'JSON', undefined, 'ADVANCED', 1002),
  style: schemaProps.hashlist(
    'Style',
    false,
    undefined,
    undefined,
    undefined,
    1002,
  ),
  children: schemaProps.hidden(false, 'array', 1003),
};

/**
 * ExtractedLayoutProps - Extracted props from currently layout containers
 * Needed to define the orientation of the container
 */
interface ExtractedLayoutProps {
  layout?: FlexListProps['layout'];
  vertical?: ContainerProps['vertical'];
}

type ComponentContainerProps = WegasComponentProps & ExtractedLayoutProps;

const pageDispatch = pagesStateStore.dispatch;

export function ComponentContainer({
  componentType,
  path,
  childrenType,
  containerType,
  last,
  noHandle,
  name,
  options,
  layout,
  vertical,
  className,
  style,
  children,
}: ComponentContainerProps) {
  const container = React.useRef<HTMLDivElement>();
  const [stackedHandles, setStackedHandles] = React.useState<JSX.Element[]>();

  const [{ isOver }, dropZone] = useDndComponentDrop();

  const {
    onDrop,
    editMode,
    handles,
    pageIdPath,
    showBorders,
  } = React.useContext(pageCTX);

  const pageId = pageIdPath.slice(0, 1)[0];
  const containerPath = [...path];
  const itemPath = containerPath.pop();
  const isNotFirstComponent = path.length > 0;
  const editable = editMode && isNotFirstComponent;
  const showLayout = showBorders && containerType != null;

  const locked = useStore(
    s =>
      options?.actions?.lock != null &&
      s.global.locks[options.actions.lock] === true,
  );

  const isFocused = usePagesStateStore(
    isComponentFocused(editMode, pageId, path),
  );

  const computedVertical =
    containerType === 'FLEX'
      ? layout?.flexDirection === 'column' ||
        layout?.flexDirection === 'column-reverse'
      : containerType === 'LINEAR'
      ? vertical
      : false;

  const Container = React.useMemo(() => {
    switch (childrenType) {
      case 'LINEAR':
        return Content;
      case 'ABSOLUTE':
        return AbsoluteItem;
      case 'FLEX':
      default:
        return FlexItem;
    }
  }, [childrenType]);

  return (
    <>
      <Container
        ref={ref => {
          dropZone(ref);
          if (ref != null) {
            container.current = ref;
          }
        }}
        {...omit(options, ['actions', 'upgrades'])}
        className={
          cx(handleControlStyle, flex, {
            [layoutHighlightStyle]: showLayout,
            [childHighlightStyle]: showLayout,
            [handleControlHoverStyle]: editMode,
            [focusedComponentStyle]: isFocused,
            [childDropzoneHorizontalStyle]: !computedVertical,
            [childDropzoneVerticalStyle]: computedVertical,
            [lockedStyle]: locked,
          }) + classNameOrEmpty(className)
        }
        style={{
          cursor: options?.actions && !locked ? 'pointer' : 'initial',
          ...style,
        }}
        onClick={() => {
          if (!locked && options && options.actions) {
            if (
              !options.actions.confirmClick ||
              // TODO : Find a better way to do that than a modal!!!
              // eslint-disable-next-line no-alert
              confirm(options.actions.confirmClick)
            ) {
              Object.entries(
                omit(
                  options.actions,
                  'confirmClick',
                  'lock',
                ) as WegasComponentOptionsActions,
              )
                .sort(
                  (
                    [, v1]: [string, WegasComponentOptionsAction],
                    [, v2]: [string, WegasComponentOptionsAction],
                  ) =>
                    (v1.priority ? v1.priority : 0) -
                    (v2.priority ? v2.priority : 0),
                )
                .forEach(([k, v]) =>
                  wegasComponentActions[k as keyof WegasComponentActions](v),
                );
            }
          }
        }}
        onMouseOver={e => {
          if (editable) {
            e.stopPropagation();
            if (!stackedHandles) {
              setStackedHandles(() => computeHandles(handles, path));
            }
            pageDispatch(PageStateAction.setFocused(pageId, path));
          }
        }}
        onMouseLeave={() => {
          if (editable) {
            setStackedHandles(undefined);
          }
          pageDispatch(PageStateAction.unsetFocused());
        }}
        tooltip={options?.upgrades?.tooltip}
      >
        {editable && containerType === 'ABSOLUTE' && (
          <ComponentDropZone
            onDrop={(dndComponent, dndMonitor) => {
              if (container.current) {
                const { x: absX, y: absY } = dndMonitor.getClientOffset() || {
                  x: 0,
                  y: 0,
                };
                const {
                  left: srcX,
                  top: srcY,
                } = container.current.getBoundingClientRect() || {
                  x: 0,
                  y: 0,
                };

                const [relX, relY] = [absX - srcX, absY - srcY];

                onDrop(dndComponent, path, undefined, {
                  options: {
                    layout: { position: { left: relX, top: relY } },
                  },
                });
              }
            }}
            show={isOver}
            dropPosition="INTO"
          />
        )}
        {editable && childrenType !== 'ABSOLUTE' && (
          <ComponentDropZone
            onDrop={dndComponent =>
              onDrop(dndComponent, containerPath, itemPath)
            }
            show={isOver}
            dropPosition="BEFORE"
          />
        )}
        {!noHandle && editable && (
          <EditHandle
            name={name}
            stackedHandles={stackedHandles}
            componentType={componentType}
            path={path}
          />
        )}
        <ErrorBoundary>{children}</ErrorBoundary>
        {options?.upgrades?.infoBeam && (
          <InfoBeam {...options.upgrades.infoBeam} />
        )}
        {editable && childrenType !== 'ABSOLUTE' && (
          <ComponentDropZone
            onDrop={dndComponent =>
              onDrop(
                dndComponent,
                containerPath,
                itemPath != null ? itemPath + 1 : itemPath,
              )
            }
            show={isOver}
            dropPosition="AFTER"
          />
        )}
        <LockedOverlay locked={locked} />
      </Container>
      {childrenType === 'LINEAR' && !last && <Splitter />}
    </>
  );
}
