import * as React from 'react';
import { css, cx } from 'emotion';
import { dropZoneClass } from '../../Contexts/DefaultDndProvider';
import { PAGEEDITOR_COMPONENT_TYPE } from '../../../Editor/Components/Page/ComponentPalette';
import { useDrop, DropTargetMonitor, DragElementWrapper } from 'react-dnd';
import {
  pageCTX,
  Handles,
  PageEditorComponent,
  pageEditorCTX,
} from '../../../Editor/Components/Page/PageEditor';
import { flex } from '../../../css/classes';
import {
  FlexItem,
  FlexListProps,
  defaultFlexLayoutOptionsKeys,
} from '../../Layouts/FlexList';
import { ErrorBoundary } from '../../../Editor/Components/ErrorBoundary';
import { useDebounce } from '../../Hooks/useDebounce';
import { pick, cloneDeep, omit } from 'lodash-es';
import { FonkyFlexContent, FonkyFlexSplitter } from '../../Layouts/FonkyFlex';
import {
  pagesStateStore,
  usePagesStateStore,
  isComponentFocused,
  PageStateAction,
} from '../../../data/pageStore';
import {
  WegasComponentOptionsActions,
  WegasComponentOptionsActionsProperties,
  WegasComponentExtra,
  WegasComponentOptionsAction,
  wegasComponentActions,
  defaultWegasComponentActionsKeys,
  defaultWegasComponentOptionsActionsKeys,
} from './options';
import {
  AbsoluteItem,
  defaultAbsoluteLayoutPropsKeys,
} from '../../Layouts/Absolute';
import { InfoBullet } from './InfoBullet';
import { EditHandle } from './EditHandle';
import { PAGE_LAYOUT_COMPONENT } from '../../../Editor/Components/Page/PagesLayout';
import { ExtrasState, ComponentExtrasManager } from './ExtrasComponent';
// import { ActionsState, ComponentActionsManager } from './ActionsComponent';
import {
  PlayerLinearLayoutProps,
  PlayerLinearLayoutChildrenProps,
} from '../Layouts/LinearLayout.component';
import { useDropFunctions } from '../../Hooks/useDropFunctions';
import { themeVar } from '../../Style/ThemeVars';
import { useStore } from '../../../data/store';
import { deepDifferent } from '../../Hooks/storeHookFactory';
import { usePageComponentStore } from './componentFactory';

// Styles
export const layoutHighlightStyle = css({
  borderStyle: 'solid',
  borderWidth: '2px',
  borderColor: themeVar.Common.colors.HighlightColor,
});

export const childHighlightCSS = {
  borderStyle: 'dotted',
  borderWidth: '1px',
  borderColor: themeVar.Common.colors.HighlightColor,
};

const childHighlightStyle = css({
  '&>*>*': childHighlightCSS,
});

const childDropZoneIntoCSS = {
  '&>* .component-dropzone-into': {
    width: '100%',
    height: '100%',
  },
};

const childDropzoneHorizontalStyle = css({
  ...childDropZoneIntoCSS,
  '&>* .component-dropzone': {
    maxWidth: '30px',
    width: '30%',
    height: '100%',
  },
  '&>* .component-dropzone-after': {
    right: 0,
  },
});

const childDropzoneVerticalStyle = css({
  ...childDropZoneIntoCSS,
  '&>* .component-dropzone': {
    maxHeight: '30px',
    width: '100%',
    height: '30%',
  },
  '&>* .component-dropzone-after': {
    bottom: 0,
  },
});

const handleControlStyle = css({
  // textAlign: 'center',
  '&>.wegas-component-handle': {
    visibility: 'hidden',
    opacity: 0.0,
  },
  ':hover>.wegas-component-handle': {
    visibility: 'unset',
    opacity: 0.8,
  },
});

const disabledStyle = css({
  opacity: 0.5,
  backgroundColor: themeVar.Common.colors.DisabledColor,
});

const focusedComponentStyle = css({
  backgroundColor: themeVar.Common.colors.HoverColor,
});

const handleControlHoverStyle = css({
  ':hover': {
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: themeVar.Common.colors.HoverColor,
  },
});

const emptyLayoutItemStyle: React.CSSProperties = {
  textAlign: 'center',
  verticalAlign: 'middle',
  borderStyle: 'solid',
  borderWidth: '1px',
  width: '100px',
  height: 'fit-content',
  overflowWrap: 'normal',
  zIndex: 0,
};

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
 *
 * @param page
 * @param path
 */
function getComponentFromPath(page: WegasComponent, path: number[]) {
  const newPath = [...path];
  let component: WegasComponent = page;
  while (newPath.length > 0) {
    const index = newPath.shift();
    if (
      index == null ||
      component == null ||
      component.props == null ||
      component.props.children == null
    ) {
      return undefined;
    } else {
      component = component.props.children[index];
    }
  }
  return {
    ...cloneDeep(omit(component, 'children')),
    nbChildren: component.props.children?.length,
  };
}

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
  onDrop?: (
    dndComponnent: PageEditorComponent,
    dndMonitor: DropTargetMonitor,
  ) => void,
): [
  {
    isOver: boolean;
    isOverCurrent: boolean;
    canDrop: boolean;
    item: PageEditorComponent | null;
  },
  DragElementWrapper<{}>,
] {
  const [dropZoneProps, dropZone] = useDrop<
    PageEditorComponent,
    void,
    {
      isOver: boolean;
      isOverCurrent: boolean;
      canDrop: boolean;
      item: PageEditorComponent | null;
    }
  >({
    accept: [PAGEEDITOR_COMPONENT_TYPE, PAGE_LAYOUT_COMPONENT],
    canDrop: () => true,
    drop: onDrop,
    collect: (mon: DropTargetMonitor) => ({
      isOver: mon.isOver({ shallow: false }),
      isOverCurrent: mon.isOver({ shallow: true }),
      canDrop: mon.canDrop(),
      item: mon.getItem() as PageEditorComponent | null,
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
  onDrop?: (
    dndComponnent: PageEditorComponent,
    dndMonitor: DropTargetMonitor,
  ) => void;
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
        // visibility: show ? 'visible' : 'collapse',
        ...(show ? {} : { display: 'none' }),
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
   * onDragEnter - triggered when the mouse is dragging over the element
   */
  onDragEnter?: (event: React.DragEvent<HTMLDivElement>) => void;
  /**
   * onDragLeave - triggered when the mouse is dragging out of the element
   */
  onDragLeave?: (event: React.DragEvent<HTMLDivElement>) => void;
  /**
   * onDragEnd - triggered when the mouse stops dragging any element
   */
  onDragEnd?: (event: React.DragEvent<HTMLDivElement>) => void;
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
 * EmptyPageComponentProps - The props needed for a virtual component (used in a layout when no children)
 */
export interface EmptyPageComponentProps {
  /**
   * path - the path of the current component
   */
  path: number[];
  /**
   * childrenType - the item type of the component
   */
  childrenType: ContainerTypes;
}
/**
 * PageComponentProps - The props that are needed by the ComponentContainer
 */
export interface PageComponentProps extends EmptyPageComponentProps {
  /**
   * componentType - The type of component
   */
  componentType: string;
  /**
   * containerType - the container type of the component
   */
  containerType: ContainerTypes;
  /**
   * last - is this component the last of the list
   */
  last?: boolean;
}

export type WegasComponentOptions = WegasComponentOptionsActions &
  WegasComponentOptionsActionsProperties &
  WegasComponentExtra & {
    [options: string]: unknown;
  };

const defaultExtras: WegasComponentExtra = {
  disableIf: undefined,
  hideIf: undefined,
  infoBullet: undefined,
  lock: undefined,
  readOnlyIf: undefined,
  style: undefined,
  themeMode: undefined,
  tooltip: undefined,
  unreadCount: undefined,
};

const defaultExtrasKeys = Object.keys(defaultExtras);

/**
 * WegasComponentProps - Required props for a Wegas component
 */
export interface WegasComponentProps
  extends React.PropsWithChildren<ClassAndStyle> {
  // WegasComponentOptions // PageComponentProps ,
  // pageId?: string;
  // path?: number[];
  // uneditable?: boolean;
  // childrenType?: ContainerTypes;
  // last?: boolean;
  // linearChildrenProps?: ExtractedLayoutProps['linearChildrenProps'];
}

/**
 * ExtractedLayoutProps - Extracted props from currently layout containers
 * Needed to define the orientation of the container
 */
export interface ExtractedLayoutProps {
  layout?: FlexListProps['layout'];
  vertical?: PlayerLinearLayoutProps['vertical'];
  linearChildrenProps?: PlayerLinearLayoutChildrenProps;
}

interface ComponentContainerProps extends WegasComponentOptions {
  pageId?: string;
  path?: number[];
  childrenType?: ContainerTypes;
}

const pageDispatch = pagesStateStore.dispatch;

export function ComponentContainer({
  pageId,
  path,
  childrenType,
}: ComponentContainerProps) {
  const realPath = path || [];

  debugger;

  const wegasComponent = useStore(s => {
    if (!pageId) {
      return undefined;
    }

    const page = s.pages[pageId];
    if (!page) {
      return undefined;
    }

    debugger;

    return getComponentFromPath(page, realPath);
  }, deepDifferent);

  const { nbChildren } = wegasComponent
    ? wegasComponent
    : { nbChildren: undefined };
  const restProps = (wegasComponent && wegasComponent.props) || {};
  const extras = pick(restProps, defaultExtrasKeys);
  const actions = pick(restProps, defaultWegasComponentActionsKeys);

  const oldType = React.useRef<string>();
  const oldComponent = React.useRef<{
    WegasComponent: React.FunctionComponent<WegasComponentProps>;
    containerType: ContainerTypes;
    componentName: string;
  }>();
  const component = usePageComponentStore(
    s => {
      if (wegasComponent && wegasComponent.type !== oldType.current) {
        oldType.current = wegasComponent?.type;
        oldComponent.current = s[(wegasComponent && wegasComponent.type) || ''];
      }
      return oldComponent.current;
    },
    (a, b) => a?.componentName !== b?.componentName,
  ) as {
    WegasComponent: React.FunctionComponent<WegasComponentProps>;
    containerType: ContainerTypes;
    componentName: string;
  };

  const { WegasComponent, containerType, componentName } = component || {};

  const container = React.useRef<HTMLDivElement>();
  const mouseOver = React.useRef<boolean>(false);
  const [dragHoverState, setDragHoverState] = React.useState<boolean>(false);
  const [stackedHandles, setStackedHandles] = React.useState<JSX.Element[]>();
  const [extraState, setExtraState] = React.useState<ExtrasState>({});

  const {
    onDrop,
    editMode,
    handles,
    // pageIdPath,
    showBorders,
  } = React.useContext(pageCTX);

  const { editedPath } = React.useContext(pageEditorCTX);

  // const pageId = pageIdPath.slice(0, 1)[0];
  const containerPath = [...(path || [])];
  const itemIndex = containerPath.pop();
  const isNotFirstComponent = realPath.length > 0;
  const editable = editMode && isNotFirstComponent;
  const showComponent = editable || !extraState.hidden;
  const showLayout = showBorders && containerType != null;
  const computedVertical =
    containerType === 'FLEX'
      ? restProps.layout?.flexDirection === 'column' ||
        restProps.layout?.flexDirection === 'column-reverse'
      : containerType === 'LINEAR'
      ? restProps.vertical
      : false;

  // debugger;
  // const showSplitter =
  //   childrenType === 'LINEAR' && !last && (editMode || !noSplitter);
  // const allowResize = childrenType === 'LINEAR' && (editMode || !noResize);
  // const isDisabled = (actions.locked || upgrades.disabled) === true;
  const isSelected = JSON.stringify(realPath) === JSON.stringify(editedPath);
  const isFocused = usePagesStateStore(
    s => pageId != null && isComponentFocused(editMode, pageId, realPath)(s),
  );

  const showSplitter =
    containerType === 'LINEAR' && (editMode || !restProps.noSplitter);
  const allowResize =
    containerType === 'LINEAR' && (editMode || !restProps.noResize);

  const childrenPack = React.useMemo(() => {
    const newChildren: JSX.Element[] = [];
    for (let i = 0; nbChildren != null && i < nbChildren; ++i) {
      const last = i === nbChildren - 1;

      newChildren.push(
        <React.Fragment
          key={JSON.stringify([...(realPath ? realPath : []), i])}
        >
          <ComponentContainer
            pageId={pageId}
            path={[...realPath, i]}
            childrenType={containerType}
            // childrenVertical={computedVertical}
          />
          {showSplitter && !last && (
            <FonkyFlexSplitter notDraggable={!allowResize} />
          )}
        </React.Fragment>,
      );
    }
    return newChildren;
  }, [
    nbChildren,
    pageId,
    realPath,
    showSplitter,
    allowResize,
    containerType,
    // computedVertical,
  ]);

  const Container = React.useMemo(() => {
    switch (childrenType) {
      case 'LINEAR':
        return FonkyFlexContent;
      case 'ABSOLUTE':
        return AbsoluteItem;
      case 'FLEX':
      default:
        return FlexItem;
    }
  }, [childrenType]);

  // const onClick = React.useCallback(() => {
  //   if (!isDisabled && actions.onClick != null) {
  //     actions.onClick();
  //   }
  // }, [isDisabled, actions]);

  const onClick = React.useCallback(() => {
    if (
      !restProps.confirmClick ||
      // TODO : Find a better way to do that than a modal!!!
      // eslint-disable-next-line no-alert
      confirm(restProps.confirmClick)
    ) {
      Object.entries(
        pick(
          restProps,
          defaultWegasComponentOptionsActionsKeys,
        ) as WegasComponentOptionsActions,
      )
        .sort(
          (
            [, v1]: [string, WegasComponentOptionsAction],
            [, v2]: [string, WegasComponentOptionsAction],
          ) =>
            (v1.priority ? v1.priority : 0) - (v2.priority ? v2.priority : 0),
        )
        .forEach(([k, v]) =>
          wegasComponentActions[k as keyof WegasComponentOptionsActions](v),
        );
    }
  }, [restProps]);

  const onMouseOver = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!mouseOver.current) {
        mouseOver.current = true;
        if (editable) {
          e.stopPropagation();
          if (!stackedHandles) {
            setStackedHandles(() => computeHandles(handles, realPath));
          }
          if (pageId != null) {
            pageDispatch(PageStateAction.setFocused(pageId, realPath));
          }
        }
      }
    },
    [editable, handles, pageId, realPath, stackedHandles],
  );

  const onMouseLeave = React.useCallback(() => {
    mouseOver.current = false;
    if (editable) {
      setStackedHandles(undefined);
      pageDispatch(PageStateAction.unsetFocused());
    }
  }, [editable]);

  const dragEnter = React.useCallback(() => {
    if (editable) {
      setDragHoverState(true);
    }
  }, [editable]);

  const dragLeave = React.useCallback(() => {
    if (editable) {
      setDragHoverState(false);
    }
  }, [editable]);

  const dropFunctions = useDropFunctions(dragEnter, dragLeave, dragLeave);

  React.useEffect(() => {
    setDragHoverState(false);
  }, [nbChildren]);

  const onEditableComponentDrop = React.useCallback(
    (dndComponent, dndMonitor) => {
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

        onDrop(dndComponent, realPath, undefined, {
          layout: { position: { left: relX, top: relY } },
        });
      }
    },
    [onDrop, realPath],
  );

  if (!wegasComponent) {
    return <pre>JSON error in page</pre>;
  }
  if (!component) {
    return <div>{`Unknown component : ${wegasComponent.type}`}</div>;
  }

  return (
    <>
      {Object.keys(extras).length > 0 && (
        <ComponentExtrasManager
          extras={extras}
          setExtrasState={setExtraState}
        />
      )}
      <Container
        ref={ref => {
          // dropZone(ref);
          if (ref != null) {
            container.current = ref;
          }
        }}
        {...pick(
          restProps,
          childrenType === 'FLEX'
            ? defaultFlexLayoutOptionsKeys
            : childrenType === 'ABSOLUTE'
            ? defaultAbsoluteLayoutPropsKeys
            : [],
        )}
        className={cx(handleControlStyle, flex, extraState.themeModeClassName, {
          [layoutHighlightStyle]: showLayout,
          [childHighlightStyle]: showLayout,
          [handleControlHoverStyle]: editMode,
          [focusedComponentStyle]: isFocused || isSelected,
          [childDropzoneHorizontalStyle]: !computedVertical,
          [childDropzoneVerticalStyle]: computedVertical,
          [disabledStyle]: extraState.disabled,
        })}
        style={{
          cursor:
            Object.keys(actions).length > 0 && !extraState.disabled
              ? 'pointer'
              : 'initial',
        }}
        onClick={onClick}
        onMouseOver={onMouseOver}
        onMouseLeave={onMouseLeave}
        {...dropFunctions}
        tooltip={extraState.tooltip}
      >
        {dragHoverState && editable && containerType === 'ABSOLUTE' && (
          <ComponentDropZone
            onDrop={onEditableComponentDrop}
            show
            dropPosition="INTO"
          />
        )}
        {dragHoverState && editable && childrenType !== 'ABSOLUTE' && (
          <ComponentDropZone
            onDrop={dndComponent =>
              onDrop(dndComponent, containerPath, itemIndex)
            }
            show
            dropPosition="BEFORE"
          />
        )}
        {editable && (
          <EditHandle
            name={name}
            stackedHandles={stackedHandles}
            componentType={componentName}
            path={realPath}
            infoMessage={
              extraState.hidden
                ? 'This component is shown only in edit mode'
                : undefined
            }
            isSelected={isSelected}
          />
        )}
        {showComponent && (
          <ErrorBoundary key={pageId}>
            <WegasComponent
              // path={realPath}
              // last={last}
              // componentType={componentName}
              // containerType={containerType}
              // childrenType={childrenType}
              {...restProps}
            >
              {editMode && nbChildren === 0 ? (
                <EmptyComponentContainer
                  childrenType={containerType}
                  path={realPath}
                />
              ) : (
                childrenPack
              )}
            </WegasComponent>
          </ErrorBoundary>
        )}
        {extraState.infoBulletProps && (
          <InfoBullet {...extraState.infoBulletProps} />
        )}
        {dragHoverState && editable && childrenType !== 'ABSOLUTE' && (
          <ComponentDropZone
            onDrop={dndComponent =>
              onDrop(
                dndComponent,
                containerPath,
                itemIndex != null ? itemIndex + 1 : itemIndex,
              )
            }
            show
            dropPosition="AFTER"
          />
        )}
        <LockedOverlay
          locked={(extraState.disabled || extraState.locked) === true}
        />
      </Container>
      {showSplitter && <FonkyFlexSplitter notDraggable={!allowResize} />}
    </>
  );
}

export function EmptyComponentContainer({
  path,
  childrenType,
}: EmptyPageComponentProps) {
  const container = React.useRef<HTMLDivElement>();

  const [{ isOver }, dropZone] = useDndComponentDrop();

  const { onDrop, editMode } = React.useContext(pageCTX);

  const Container = React.useMemo(() => {
    switch (childrenType) {
      case 'LINEAR':
        return FonkyFlexContent;
      case 'ABSOLUTE':
        return AbsoluteItem;
      case 'FLEX':
      default:
        return FlexItem;
    }
  }, [childrenType]);

  return (
    <Container
      ref={ref => {
        dropZone(ref);
        if (ref != null) {
          container.current = ref;
        }
      }}
      className={flex}
      style={emptyLayoutItemStyle}
    >
      {editMode && childrenType !== 'ABSOLUTE' && (
        <ComponentDropZone
          onDrop={dndComponent => {
            onDrop(dndComponent, path);
          }}
          show={isOver}
          dropPosition="INTO"
        />
      )}
      The layout is empty, drop components in to fill it!
    </Container>
  );
}
