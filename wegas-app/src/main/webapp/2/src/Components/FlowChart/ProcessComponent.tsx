import * as React from 'react';
import { css, cx } from 'emotion';
import { XYPosition, useMouseEventDnd } from '../Hooks/useMouseEventDnd';
import { FlowLine, Process, Processes } from './FlowChart';
import { useDrop } from 'react-dnd';
import { DnDFlowchartHandle, PROCESS_HANDLE_DND_TYPE } from './Handles';
import {
  selectedStateBoxStyle,
  stateBoxActionStyle,
  stateBoxStyle,
} from './StateProcessComponent';
import { themeVar } from '../Style/ThemeVars';
import { isActionAllowed } from '../PageComponents/tools/options';
import { classNameOrEmpty } from '../../Helper/className';

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
  children,
  ...options
}: React.PropsWithChildren<ProcessProps<F, P>>) {
  const processElement = React.useRef<HTMLDivElement | null>(null);
  const clickPosition = React.useRef<XYPosition>({ x: 0, y: 0 });
  const [, drop] = useDrop<DnDFlowchartHandle<F, P>, unknown, unknown>({
    accept: PROCESS_HANDLE_DND_TYPE,
    canDrop: () => isActionAllowed(options),
    drop: ({ processes, flowline }) => {
      onConnect(processes, flowline);
    },
  });

  const onDragStart = React.useCallback((e: MouseEvent) => {
    const targetBox = (e.target as HTMLDivElement).getBoundingClientRect();
    clickPosition.current = {
      x: e.clientX - targetBox.left,
      y: e.clientY - targetBox.top,
    };
  }, []);

  const onDrag = React.useCallback(
    (e: MouseEvent, position: XYPosition) => onMove(position, e),
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
      onDragStart,
      onDrag,
      onDragEnd,
    },
    true,
    !isActionAllowed(options) || process.undraggable,
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
}

export function DefaultProcessComponent<
  F extends FlowLine,
  P extends Process<F>
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
