import { css, cx } from '@emotion/css';
import { pick } from 'lodash-es';
import * as React from 'react';
import {
  flex,
  foregroundContent,
  hoverColorInsetShadow,
  thinHoverColorInsetShadow,
} from '../../../css/classes';
import { manageResponseHandler } from '../../../data/actions';
import { asyncRunLoadedScript } from '../../../data/Reducer/VariableInstanceReducer';
import { pagesContextStateStore } from '../../../data/Stores/pageContextStore';
import {
  isComponentFocused,
  pagesStateStore,
  PageStateAction,
  usePagesStateStore,
} from '../../../data/Stores/pageStore';
import { store, ThunkResult } from '../../../data/Stores/store';
import { ErrorBoundary } from '../../../Editor/Components/ErrorBoundary';
import {
  DnDComponent,
  isDnDComponent,
} from '../../../Editor/Components/Page/ComponentPalette';
import { WegasComponentCommonProperties } from '../../../Editor/Components/Page/ComponentProperties';
import { Handles, pageCTX } from '../../../Editor/Components/Page/PageEditor';
import {
  ALLOWED_PAGE_EDITOR_COMPONENTS,
  isPageComponentNode,
  PageComponentNode,
} from '../../../Editor/Components/Page/PagesLayout';
import { classNameOrEmpty } from '../../../Helper/className';
import { wwarn } from '../../../Helper/wegaslog';
import {
  dropZoneFocus,
  dropZoneHover,
} from '../../Contexts/DefaultDndProvider';
import { addSetterToState } from '../../Hooks/useScript';
import { TumbleLoader } from '../../Loader';
import { themeVar } from '../../Theme/ThemeVars';
import { allowDrag } from '../../TreeView/TreeView';
import { EditHandle } from './EditHandle';
import { PlayerInfoBullet } from './InfoBullet';
import {
  defaultWegasComponentOptionsActions,
  PageComponentContext,
  wegasComponentActions,
  WegasComponentActionsProperties,
  WegasComponentExtra,
  WegasComponentOptionsAction,
  WegasComponentOptionsActions,
} from './options';
import { OptionsState } from './OptionsComponent';

const childDropZoneIntoCSS = {
  '&>*>*>.component-dropzone-into': {
    width: '100%',
    height: '100%',
  },
};

const childDropzoneHorizontalStyle = css({
  ...childDropZoneIntoCSS,
  '&>*>*>.component-dropzone': {
    maxWidth: 'min(30px,30%)',
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
    maxHeight: 'min(30px,30%)',
    width: '100%',
    height: '30%',
  },
  '&>*>*>.component-dropzone-after': {
    bottom: 0,
  },
});

const handleControlStyle = css({
  '&>.wegas-component-handle': {
    visibility: 'hidden',
    opacity: 0.0,
  },
  ':hover>.wegas-component-handle': {
    visibility: 'unset',
    opacity: 0.8,
  },
});

const showBordersStyle = css({
  borderStyle: 'solid',
  borderColor: themeVar.colors.HighlightColor,
});

// Helper functions

export function assembleStateAndContext(
  context: PageComponentContext = {},
  state?: PageComponentContext,
) {
  return {
    Context: {
      ...addSetterToState(state || pagesContextStateStore.getState()),
      ...context,
    },
  };
}

function awaitExecute(
  actions: [string, WegasComponentOptionsAction][],
  context?: PageComponentContext,
): ThunkResult {
  return async function (dispatch, getState) {
    const sortedActions = actions.sort(
      ([, v1], [, v2]) =>
        (v1.priority ? v1.priority : 0) - (v2.priority ? v2.priority : 0),
    );

    for (const [k, v] of sortedActions) {
      if (k === 'impactVariable') {
        const action = v as WegasComponentOptionsActions['impactVariable'];
        if (action) {
          const gameModelId = getState().global.currentGameModelId;

          const result = await asyncRunLoadedScript(
            gameModelId,
            action.impact,
            undefined,
            undefined,
            assembleStateAndContext(context),
          );

          dispatch(manageResponseHandler(result, dispatch, getState().global));
        }
      } else {
        wegasComponentActions[k as keyof WegasComponentOptionsActions]({
          ...(v as any),
          context,
        });
      }
    }
  };
}

/**
 * onComponentClick - onClick factory that can be used by components and override classic onClick
 * @param onClickActions
 * @param context
 * @param stopPropagation
 * @param confirmClick
 */
export function onComponentClick(
  componentProps: { [props: string]: unknown },
  context?: { [variable: string]: unknown },
  stopPropagation?: boolean,
  confirmClick?: string,
) {
  const onClickActions = Object.entries(
    pick(
      componentProps,
      Object.keys(defaultWegasComponentOptionsActions),
    ) as WegasComponentOptionsActions,
  );

  return function (event: React.MouseEvent<HTMLElement, MouseEvent>) {
    if (stopPropagation) {
      event.stopPropagation();
    }
    if (
      !confirmClick ||
      // TODO : Find a better way to do that than a modal!!!
      // eslint-disable-next-line no-alert
      confirm(confirmClick)
    ) {
      store.dispatch(awaitExecute(onClickActions, context));
    }
  };
}

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

// /**
//  * useDndComponentDrop - it's a hook that normalize the usage of useDrop in the different dropable zone used in this file
//  * @param onDrop - the function to trigger when a drop occures
//  */
// export function useDndComponentDrop(
//   onDrop?: (
//     dndComponnent: PageEditorComponent,
//     dndMonitor: DropTargetMonitor,
//   ) => void,
// ): [
//   {
//     isOver: boolean;
//     isOverCurrent: boolean;
//     canDrop: boolean;
//     item: PageEditorComponent | null;
//   },
//   DragElementWrapper<{}>,
// ] {
//   const [dropZoneProps, dropZone] = useDrop<
//     PageEditorComponent,
//     void,
//     {
//       isOver: boolean;
//       isOverCurrent: boolean;
//       canDrop: boolean;
//       item: PageEditorComponent | null;
//     }
//   >({
//     accept: [PAGEEDITOR_COMPONENT_TYPE, PAGE_LAYOUT_COMPONENT],
//     canDrop: () => true,
//     drop: onDrop,
//     collect: (mon: DropTargetMonitor) => ({
//       isOver: mon.isOver({ shallow: false }),
//       isOverCurrent: mon.isOver({ shallow: true }),
//       canDrop: mon.canDrop(),
//       item: mon.getItem() as PageEditorComponent | null,
//     }),
//   });
//   const delayedCanDrop = useDebounce(dropZoneProps.canDrop, 100);
//   return [{ ...dropZoneProps, canDrop: delayedCanDrop }, dropZone];
// }

export function useDndComponentIsOverFactory(notDroppable?: boolean) {
  const [isOver, setIsOverCurrent] = React.useState(false);

  const onDragOver = React.useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer != null) {
        const types = e.dataTransfer.types;
        if (
          allowDrag(
            notDroppable === true,
            ALLOWED_PAGE_EDITOR_COMPONENTS,
            types,
          )
        ) {
          setIsOverCurrent(true);
        }
      }
    },
    [notDroppable],
  );
  const onDragLeave = React.useCallback(() => {
    setIsOverCurrent(false);
  }, []);

  const onDragExit = React.useCallback(() => {
    setIsOverCurrent(false);
  }, []);

  const ref = React.useCallback(
    (ref: HTMLDivElement | null) => {
      if (ref != null) {
        ref.addEventListener('dragover', onDragOver);
        ref.addEventListener('dragleave', onDragLeave);
        ref.addEventListener('dragexit', onDragExit);

        return () => {
          ref.removeEventListener('dragover', onDragOver);
          ref.removeEventListener('dragleave', onDragLeave);
          ref.removeEventListener('dragexit', onDragExit);
        };
      }
    },
    [onDragExit, onDragLeave, onDragOver],
  );

  return { isOver, ref };
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
  onDrop: (
    dndComponnent: PageComponentNode | DnDComponent,
    event: React.DragEvent<HTMLDivElement>,
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
  /**
   * noFocus - The drop zone will highlight only if something is over it
   */
  noFocus?: boolean;
}

export function ComponentDropZone({
  onDrop,
  show,
  dropPosition,
  noFocus,
}: ComponentDropZoneProps) {
  // const [{ isOverCurrent }, dropZone] = useDndComponentDrop(onDrop);
  const [isOverCurrent, setIsOverCurrent] = React.useState(false);

  return (
    <div
      // ref={dropZone}
      onDragOver={e => {
        e.preventDefault();
        e.stopPropagation();
        setIsOverCurrent(true);
      }}
      onDragLeave={_e => {
        setIsOverCurrent(false);
      }}
      // onDragExit={_e => {
      //   setIsOverCurrent(false);
      // }}
      onDrop={e => {
        e.preventDefault();
        e.stopPropagation();
        setIsOverCurrent(false);

        let fromData;
        try {
          fromData = JSON.parse(e.dataTransfer.getData('data'));
        } catch (_e) {
          fromData = undefined;
        }

        if (
          // onDrop &&
          fromData != null &&
          (isDnDComponent(fromData) || isPageComponentNode(fromData))
        ) {
          onDrop(fromData, e);
        } else {
          wwarn('Unmanaged component dropped');
        }
      }}
      className={
        cx({
          [dropZoneHover]: isOverCurrent,
          [dropZoneFocus]: !noFocus && !isOverCurrent,
        }) +
        (dropPosition === 'INTO'
          ? ' component-dropzone-into'
          : ' component-dropzone') +
        (dropPosition === 'AFTER' ? ' component-dropzone-after' : '')
      }
      style={{
        ...(show ? {} : { display: 'none' }),
        position: 'absolute',
        ...(dropPosition === 'AFTER'
          ? { right: 0, bottom: 0 }
          : { left: 0, top: 0 }),
        width: '100%',
        height: '100%',
      }}
    />
  );
}

const lockedOverlayStyle = css({
  width: '100%',
  height: '100%',
  left: 0,
  top: 0,
  position: 'absolute',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
});

interface LockedOverlayProps {
  locked?: boolean;
  // confirmClick: boolean;
  // onConfirmClick: (
  //   confirmed: boolean,
  //   event: React.MouseEvent<HTMLElement, MouseEvent>,
  // ) => void;
}

function LockedOverlay({ locked }: LockedOverlayProps) {
  return (
    <div onClick={e => e.stopPropagation()} className={lockedOverlayStyle}>
      {locked && <TumbleLoader />}
      {/* {confirmClick && <ConfirmButton onAction={onConfirmClick} />} */}
    </div>
  );
}

/**
 * WegasComponentItemProps - Required props for a layout item component
 */
export interface WegasComponentItemProps extends ClassStyleId {
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
   * onDragOver - triggered when the mouse is dragging over the element
   */
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
  /**
   * onDragEnter - triggered when the mouse is entering over the element
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
 * DropZones - the different zones in which a component can be dropped
 */
export interface DropZones {
  side?: boolean;
  center?: boolean;
}

/**
 * EmptyPageComponentProps - The props needed for a virtual component (used in a layout when no children)
 */
export interface EmptyPageComponentProps {
  /**
   * context - data that can be generated with programmatic components
   */
  context?: {
    [name: string]: unknown;
  };
  /**
   * Container - the container that is used to wrap the component
   */
  Container: ItemContainer;
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
  isContainer?: boolean;
  /**
   * dropzones - the dropzone to enable when a component is dragged over
   */
  dropzones: DropZones;
  /**
   * pageId - the id of the page
   */
  pageId: string | undefined;
  /**
   * path - the path of the current component
   */
  path: number[];
  /**
   * options - conditionnal states
   */
  options: OptionsState;
}

export type WegasComponentOptions = WegasComponentOptionsActions &
  WegasComponentActionsProperties &
  WegasComponentExtra & {
    [options: string]: unknown;
  };

/**
 * WegasComponentProps - Required props for a Wegas component
 */
export interface WegasComponentProps
  extends React.PropsWithChildren<ClassStyleId>,
    Omit<WegasComponentCommonProperties, 'children'>,
    PageComponentProps,
    WegasComponentOptions {}

export type ItemContainer = React.ForwardRefExoticComponent<
  WegasComponentItemProps & {
    children?: React.ReactNode;
  } & React.RefAttributes<HTMLDivElement>
>;

interface ComponentContainerProps extends WegasComponentProps {
  vertical?: boolean;
  containerPropsKeys?: string[];
  onClickManaged: boolean;
}

const pageDispatch = pagesStateStore.dispatch;

export function ComponentContainer({
  componentType,
  path,
  isContainer,
  name,
  layout,
  vertical,
  layoutClassName,
  layoutStyle = {},
  children,
  context,
  Container,
  containerPropsKeys = [],
  dropzones,
  options,
  stopPropagation,
  confirmClick,
  actions,
  onClickManaged,
  ...restProps
}: ComponentContainerProps) {
  const container = React.useRef<HTMLDivElement>(null);
  const mouseOver = React.useRef<boolean>(false);
  const [dragHoverState, setDragHoverState] = React.useState<boolean>(false);
  const [stackedHandles, setStackedHandles] = React.useState<JSX.Element[]>();

  const { onDrop, editMode, handles, pageIdPath, showBorders, editedPath } =
    React.useContext(pageCTX);

  const pageId = pageIdPath.slice(0, 1)[0];
  const containerPath = [...path];
  const itemPath = containerPath.pop();
  const isNotFirstComponent = path.length > 0;
  const editable = editMode && isNotFirstComponent;
  const showComponent = !options.hidden;

  const isSelected = JSON.stringify(path) === JSON.stringify(editedPath);
  const isFocused = usePagesStateStore(
    isComponentFocused(editMode, pageId, path),
  );

  const onClick = React.useCallback(
    onClickManaged
      ? () => {}
      : onComponentClick(restProps, context, stopPropagation, confirmClick),
    [stopPropagation, confirmClick, restProps, context, onClickManaged],
  );

  const onMouseOver = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!mouseOver.current) {
        mouseOver.current = true;
        if (editable) {
          e.stopPropagation();
          if (!stackedHandles) {
            setStackedHandles(() => computeHandles(handles, path));
          }
          pageDispatch(PageStateAction.setFocused(pageId, path));
        }
      }
    },
    [editable, handles, pageId, path, stackedHandles],
  );

  const onMouseLeave = React.useCallback(() => {
    mouseOver.current = false;
    if (editable) {
      setStackedHandles(undefined);
      pageDispatch(PageStateAction.unsetFocused());
    }
  }, [editable]);

  const dragEnter = React.useCallback(
    e => {
      e.preventDefault();
      e.stopPropagation();
      if (editable) {
        setDragHoverState(true);
      }
    },
    [editable],
  );

  const dragLeave = React.useCallback(
    e => {
      if (editable) {
        if (e.currentTarget.contains(e.relatedTarget)) {
          return;
        }
        setDragHoverState(false);
      }
    },
    [editable],
  );

  React.useEffect(() => {
    setDragHoverState(false);
  }, [children]);

  function stopDragging() {
    setDragHoverState(false);
  }

  React.useEffect(() => {
    document.addEventListener('dragend', stopDragging);
    return () => {
      document.removeEventListener('dragend', stopDragging);
    };
  }, []);

  // const onEditableComponentDrop: ComponentDropZoneProps['onDrop'] =
  //   React.useCallback(
  //     (dndComponent, e) => {
  //       if (container.current) {
  //         // Get the bounding rectangle of target
  //         const rect = e.currentTarget.getBoundingClientRect();

  //         // Mouse position
  //         const x = e.clientX - rect.left;
  //         const y = e.clientY - rect.top;

  //         onDrop(dndComponent, path, undefined, {
  //           // position: { left: relX, top: relY },
  //           position: { left: x, top: y },
  //         });
  //       }
  //     },
  //     [onDrop, path],
  //   );

  return showComponent ? (
    <Container
      ref={container}
      {...pick(restProps, containerPropsKeys)}
      className={
        cx(handleControlStyle, flex, options.themeModeClassName, {
          [showBordersStyle]: showBorders && isContainer,
          [hoverColorInsetShadow]: editMode && isSelected,
          [cx(foregroundContent, thinHoverColorInsetShadow)]: isFocused,
          [childDropzoneHorizontalStyle]: !vertical,
          [childDropzoneVerticalStyle]: vertical,
        }) +
        classNameOrEmpty(layoutClassName) +
        classNameOrEmpty(options.outerClassName)
      }
      style={layoutStyle}
      onClick={
        onClickManaged || options.disabled || options.readOnly || options.locked
          ? undefined
          : onClick
      }
      onMouseOver={onMouseOver}
      onMouseLeave={onMouseLeave}
      onDragOver={dragEnter}
      onDragLeave={dragLeave}
      // {...dropFunctions}
      // onDragEnter={dragEnter}
      // onDragEnd={dragLeave}
      // onDragLeave={dragLeave}
      tooltip={options.tooltip}
    >
      {/* {dragHoverState && editable && dropzones.center && (
        <ComponentDropZone
          onDrop={onEditableComponentDrop}
          show
          dropPosition="INTO"
        />
      )} */}
      {dragHoverState && editable && dropzones.side && (
        // {true && (
        <ComponentDropZone
          onDrop={dndComponent => onDrop(dndComponent, containerPath, itemPath)}
          show
          dropPosition="BEFORE"
        />
      )}
      {!dragHoverState && editable && (
        <EditHandle
          name={name}
          stackedHandles={stackedHandles}
          componentType={componentType}
          pageId={pageId}
          path={path}
          infoMessage={
            options.hidden
              ? 'This component is shown only in edit mode'
              : undefined
          }
          isSelected={isSelected}
        />
      )}
      <ErrorBoundary>{children}</ErrorBoundary>
      {options.infoBulletProps && (
        <PlayerInfoBullet {...options.infoBulletProps} />
      )}
      {dragHoverState && editable && dropzones.side && (
        <ComponentDropZone
          onDrop={dndComponent =>
            onDrop(
              dndComponent,
              containerPath,
              itemPath != null ? itemPath + 1 : itemPath,
            )
          }
          show
          dropPosition="AFTER"
        />
      )}
      {options.locked === true && <LockedOverlay locked={options.locked} />}
    </Container>
  ) : null;
}
