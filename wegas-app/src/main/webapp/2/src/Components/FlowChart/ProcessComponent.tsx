import * as React from 'react';
import { css, cx } from 'emotion';
import { XYPosition, useMouseEventDnd } from '../Hooks/useMouseEventDnd';
import { FlowLine, Process, Processes } from './FlowChart';
import { useDrop } from 'react-dnd';
import {
  ProcessHandleProps,
  DnDFlowchartHandle,
  PROCESS_HANDLE_DND_TYPE,
} from './Handles';
import { stateBoxStyle } from './StateProcessComponent';
import { themeVar } from '../Style/ThemeVars';
import { isActionAllowed } from '../PageComponents/tools/options';

const processStyle = css({
  position: 'absolute',
  overflow: 'show',
  cursor: 'move',
  userSelect: 'none',
});

export const disabledStyle = css({
  backgroundColor: themeVar.Common.colors.DisabledColor,
  cursor: 'initial',
});

export const readOnlyStyle = css({
  cursor: 'initial',
});

export interface ProcessProps<F extends FlowLine, P extends Process<F>>
  extends DisabledReadonlyLocked {
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
  onMove: (postion: XYPosition) => void;
  /**
   * a callback triggered when a component movement ended
   */
  onMoveEnd: (postion: XYPosition) => void;
  /**
   * a callback triggered when a handle is dropped on the process component
   */
  onConnect: (processes: Processes<F, P>, flowline?: F) => void;
  /**
   * a callback triggered when a click occures on a process
   */
  onClick?: (e: ModifierKeysEvent, process: P) => void;
  /**
   * a handle component that can be dragged to create new flowlines and processes
   */
  ProcessHandle?: React.FunctionComponent<ProcessHandleProps<F, P>>;
  /**
   * a condition given by the user to see if process is selected or not
   */
  isProcessSelected?: (sourceProcess: P) => boolean;
}

interface CustomProcessProps<F extends FlowLine, P extends Process<F>>
  extends ProcessProps<F, P> {
  /**
   * the children component that recieve the process object
   * allow to customize easily the process style
   */
  children: (
    process: P,
    onClick?: (e: ModifierKeysEvent, process: P) => void,
    selected?: boolean,
  ) => React.ReactNode;
}

export function CustomProcessComponent<
  F extends FlowLine,
  P extends Process<F>
>({
  process,
  onReady,
  onMove,
  onMoveEnd,
  onConnect,
  onClick,
  children,
  isProcessSelected,
  ...options
}: CustomProcessProps<F, P>) {
  const processElement = React.useRef<HTMLDivElement | null>(null);
  const clickPosition = React.useRef<XYPosition>({ x: 0, y: 0 });
  const selected = isProcessSelected && isProcessSelected(process);
  const [, drop] = useDrop<DnDFlowchartHandle<F, P>, unknown, unknown>({
    accept: PROCESS_HANDLE_DND_TYPE,
    canDrop: () => isActionAllowed(options),
    drop: ({ processes, flowline }) => {
      onConnect(processes, flowline);
    },
  });

  const onDragStart = React.useCallback(
    (e: MouseEvent) => {
      if (isActionAllowed(options)) {
        const targetBox = (e.target as HTMLDivElement).getBoundingClientRect();
        clickPosition.current = {
          x: e.clientX - targetBox.left,
          y: e.clientY - targetBox.top,
        };
      }
    },
    [options],
  );

  const onDrag = React.useCallback(
    (_e: MouseEvent, position: XYPosition) =>
      isActionAllowed(options) && onMove(position),
    [onMove, options],
  );

  const onDragEnd = React.useCallback(
    (_e: MouseEvent, position: XYPosition) => {
      if (isActionAllowed(options)) {
        onMoveEnd({
          x: Math.max(position.x, 0),
          y: Math.max(position.y, 0),
        });
      }
    },
    [onMoveEnd, options],
  );

  useMouseEventDnd(
    processElement,
    {
      onDragStart,
      onDrag,
      onDragEnd,
    },
    true,
  );

  return (
    <div
      ref={ref => {
        drop(ref);
        if (ref != null) {
          processElement.current = ref;
          onReady(ref);
        }
      }}
      style={{ left: process.position.x, top: process.position.y }}
      className={processStyle}
      data-id={process.id}
    >
      {children(process, onClick, selected)}
    </div>
  );
}

export function DefaultProcessComponent<
  F extends FlowLine,
  P extends Process<F>
>(props: ProcessProps<F, P>) {
  return (
    <CustomProcessComponent {...props}>
      {(process, onClick) => (
        <div
          className={cx(stateBoxStyle, {
            [disabledStyle]: props.disabled || props.locked,
            [readOnlyStyle]: props.readOnly,
          })}
          onClick={e => {
            if (!props.disabled && !props.readOnly) {
              onClick && onClick(e, process);
            }
          }}
        >
          {process.id}
        </div>
      )}
    </CustomProcessComponent>
  );
}