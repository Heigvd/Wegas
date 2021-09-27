import { css, cx } from '@emotion/css';
import * as React from 'react';
import { classNameOrEmpty } from '../../Helper/className';
import { useMouseEventDnd, XYPosition } from '../Hooks/useMouseEventDnd';
import { isActionAllowed } from '../PageComponents/tools/options';
import { themeVar } from '../Theme/ThemeVars';
import { FlowLine, Process, Processes } from './FlowChart';
import { DnDFlowchartHandle } from './Handles';
import {
  selectedStateBoxStyle,
  stateBoxActionStyle,
  stateBoxStyle,
} from './StateProcessComponent';

const processStyle = css({
  position: 'absolute',
  overflow: 'show',
  cursor: 'move',
  userSelect: 'none',
});

export const disabledStyle = css({
  backgroundColor: themeVar.colors.DisabledColor,
  cursor: 'initial',
});

export const readOnlyStyle = css({
  cursor: 'initial',
});

export interface ProcessProps<F extends FlowLine, P extends Process<F>>
  extends DisabledReadonly {
  /**
   * the process object to be displayed
   */
  process: P;
  /**
   * a callback triggerd when the component is rendered
   * Could also be done with a ForwadRef but require much less workload from react and prevent type problems that way
   */
  onReady: (element: HTMLDivElement) => void;
  /**
   * a callback triggered when a component has been moved
   */
  onMove: (postion: XYPosition, e: MouseEvent) => void;
  /**
   * a callback triggered when a component movement ended
   */
  onMoveEnd: (postion: XYPosition, e: MouseEvent) => void;
  /**
   * a callback triggered when a handle is dropped on the process component
   */
  onConnect: (processes: Processes<F, P>, flowline?: F) => void;
  /**
   * a callback triggered when a handle is been dragged
   */
  onHandleMove: (
    position: XYPosition,
    item: DnDFlowchartHandle<F, P>,
    event: MouseEvent,
  ) => void;
  /**
   * a callback triggered when a dragged handle is released
   */
  onHandleMoveEnd: (
    position: XYPosition,
    item: DnDFlowchartHandle<F, P>,
    event: MouseEvent,
  ) => void;
}

export function CustomProcessComponent<
  F extends FlowLine,
  P extends Process<F>,
>({
  process,
  onReady,
  onMove,
  onMoveEnd,
  onConnect,
  zoom,
  children,
  ...options
}: React.PropsWithChildren<ProcessProps<F, P>> & { zoom: number }) {
  const processElement = React.useRef<HTMLDivElement | null>(null);
  // const clickPosition = React.useRef<XYPosition>({ x: 0, y: 0 });
  // const [{ isDragging }, drop] = useDrop<
  //   DnDFlowchartHandle<F, P>,
  //   void,
  //   { isDragging: boolean }
  // >({
  //   accept: PROCESS_HANDLE_DND_TYPE,
  //   canDrop: () => isActionAllowed(options),
  //   drop: ({ processes, flowline }) => {
  //     onConnect(processes, flowline);
  //   },
  //   collect: mon => ({
  //     isDragging: mon.isOver(),
  //   }),
  // });

  // const onDragStart = React.useCallback(
  //   (e: MouseEvent) => {
  //     const targetBox = (e.target as HTMLDivElement).getBoundingClientRect();
  //     clickPosition.current = {
  //       x: (e.clientX - targetBox.left) / zoom,
  //       y: (e.clientY - targetBox.top) / zoom,
  //     };
  //   },
  //   [zoom],
  // );

  const onDrag = React.useCallback(
    (e: MouseEvent, position: XYPosition) => {
      onMove({ x: position.x, y: position.y }, e);
    },
    [onMove],
  );

  const onDragEnd = React.useCallback(
    (e: MouseEvent, position: XYPosition) => {
      onMoveEnd(
        {
          x: Math.max(position.x, 0),
          y: Math.max(position.y, 0),
        },
        e,
      );
    },
    [onMoveEnd],
  );

  useMouseEventDnd(
    processElement,
    {
      onDragStart: undefined,
      onDrag,
      onDragEnd,
    },
    true,
    !isActionAllowed(options) || process.undraggable,
    zoom,
  );

  return (
    <div
      ref={ref => {
        // drop(ref);
        if (ref != null) {
          processElement.current = ref;
          onReady(ref);
        }
      }}
      style={{
        left: process.position.x * zoom,
        top: process.position.y * zoom,
        transform: `scale(${zoom})`,
      }}
      className={processStyle}
      data-id={process.id}
    >
      {children}
    </div>
  );
}

export interface ProcessComponentProps<F extends FlowLine, P extends Process<F>>
  extends ProcessProps<F, P> {
  /**
   * a condition given by the user to see if process is selected or not
   */
  isProcessSelected?: (sourceProcess: P) => boolean;
  /**
   * a callback triggered when a click occures on a process
   */
  onClick?: (e: ModifierKeysEvent, process: P) => void;
  /**
   * allows control the size and position of the component
   */
  zoom: number;
}

export function DefaultProcessComponent<
  F extends FlowLine,
  P extends Process<F>,
>({
  isProcessSelected,
  onClick,
  ...processProps
}: ProcessComponentProps<F, P>) {
  const { disabled, readOnly, process } = processProps;
  return (
    <CustomProcessComponent {...processProps}>
      <div
        className={
          cx(stateBoxStyle, {
            [stateBoxActionStyle]: isActionAllowed({
              disabled: disabled,
              readOnly: readOnly,
            }),
            [selectedStateBoxStyle]:
              isProcessSelected && isProcessSelected(process),
          }) + classNameOrEmpty(process.className)
        }
        style={process.style}
        onClick={e => {
          if (!disabled && !readOnly) {
            onClick && onClick(e, process);
          }
        }}
      >
        {process.id}
      </div>
    </CustomProcessComponent>
  );
}
