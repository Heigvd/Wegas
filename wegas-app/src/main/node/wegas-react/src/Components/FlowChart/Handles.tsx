import { css } from '@emotion/css';
import * as React from 'react';
import { classNameOrEmpty } from '../../Helper/className';
import { useMouseEventDnd, XYPosition } from '../Hooks/useMouseEventDnd';
import { themeVar } from '../Theme/ThemeVars';
import { FlowLine, Process, Processes } from './FlowChart';
import { ProcessComponentProps } from './ProcessComponent';

export const PROCESS_HANDLE_DND_TYPE = 'DND_PROCESS_HANDLE';

export interface DnDFlowchartHandle<F extends FlowLine, P extends Process<F>> {
  type: typeof PROCESS_HANDLE_DND_TYPE;
  processes: Processes<F, P>;
  flowline?: F;
  backward?: boolean;
}
export const PROCESS_HANDLE_SIDE = 20;

const processHandleStyle = css({
  position: 'absolute',
  zIndex: 2,
  width: `${PROCESS_HANDLE_SIDE}px`,
  height: `${PROCESS_HANDLE_SIDE}px`,
  borderRadius: `${PROCESS_HANDLE_SIDE / 2}px`,
  backgroundColor: themeVar.colors.HighlightColor,
  opacity: 0.4,
  cursor: 'move',
  ':hover': { opacity: 1 },
});

export function useHandleManagement<F extends FlowLine, P extends Process<F>>(
  onHandleMove: (
    position: XYPosition,
    item: DnDFlowchartHandle<F, P>,
    event: MouseEvent,
  ) => void,
  onHandleMoveEnd: (
    position: XYPosition,
    item: DnDFlowchartHandle<F, P>,
    event: MouseEvent,
  ) => void,
  sourceProcess: P,
  zoom: number,
) {
  const handleElement = React.useRef<HTMLDivElement>(null);
  const onDrag = React.useCallback(
    (e: MouseEvent, position: XYPosition) => {
      onHandleMove(
        { x: position.x, y: position.y },
        {
          type: PROCESS_HANDLE_DND_TYPE,
          processes: { sourceProcess },
        },
        e,
      );
    },
    [onHandleMove, sourceProcess],
  );

  const onDragEnd = React.useCallback(
    (e: MouseEvent, position: XYPosition) => {
      onHandleMoveEnd(
        {
          x: Math.max(position.x, 0),
          y: Math.max(position.y, 0),
        },
        {
          type: PROCESS_HANDLE_DND_TYPE,
          processes: { sourceProcess },
        },
        e,
      );
    },
    [onHandleMoveEnd, sourceProcess],
  );

  useMouseEventDnd(
    handleElement,
    {
      onDragStart: undefined,
      onDrag,
      onDragEnd,
    },
    true,
    true,
    zoom,
  );

  return handleElement;
}

export interface ProcessHandleProps<F extends FlowLine, P extends Process<F>>
  extends Pick<
    ProcessComponentProps<F, P>,
    'zoom' | 'onHandleMove' | 'onHandleMoveEnd'
  > {
  /**
   * the process from which the flowline is comming
   */
  sourceProcess: P;
  /**
   * a function that is called when a handle is moved
   */
}

export function DefaultProcessHandle<F extends FlowLine, P extends Process<F>>({
  sourceProcess,
  onHandleMove,
  onHandleMoveEnd,
  zoom,
}: ProcessHandleProps<F, P>) {
  // const [, drag] = useDrag<DnDFlowchartHandle<F, P>, unknown, unknown>({
  //   item: {
  //     type: PROCESS_HANDLE_DND_TYPE,
  //     processes: { sourceProcess },
  //   },
  // });

  const handleElement = useHandleManagement(
    onHandleMove,
    onHandleMoveEnd,
    sourceProcess,
    zoom,
  );

  return (
    <div
      ref={handleElement}
      style={{
        right: `${-PROCESS_HANDLE_SIDE / 2}px`,
        top: `calc(50% - ${PROCESS_HANDLE_SIDE / 2}px)`,
      }}
      className={processHandleStyle}
      data-nodrag={true}
    />
  );
}

export const FLOW_HANDLE_SIDE = 30;

const flowHandleStyle = (selected: boolean) =>
  css({
    position: 'absolute',
    zIndex: selected ? 1000 : 1,
    width: `${FLOW_HANDLE_SIDE}px`,
    height: `${FLOW_HANDLE_SIDE}px`,
    borderRadius: `${FLOW_HANDLE_SIDE / 2}px`,
    backgroundColor: themeVar.colors.HighlightColor,
    opacity: selected ? 0.4 : 0.0,
    cursor: 'move',
    ':hover': { opacity: 1 },
  });

export interface FlowLineHandleProps<F extends FlowLine, P extends Process<F>>
  extends ClassStyleId {
  /**
   * the position of the handle
   */
  position: XYPosition;
  /**
   * the translation offset ratio
   */
  translation: XYPosition;
  /**
   * the rotation in rad
   */
  rotation: number;
  /**
   * the source or target process of the flowline
   */
  processes: Processes<F, P>;
  /**
   * the flowline object to drag (if already existing)
   */
  flowline: F;
  /**
   * is the flowline selected
   */
  selected: boolean;
  /**
   * is the flowline grabbed by the tail
   */
  backward: boolean;
}

export function FlowLineHandle<F extends FlowLine, P extends Process<F>>({
  position,
  translation,
  rotation,
  processes,
  flowline,
  selected,
  backward,
  id,
  className,
  style,
}: FlowLineHandleProps<F, P>) {
  const [, drag] = useDrag<DnDFlowchartHandle<F, P>, unknown, unknown>({
    item: {
      type: PROCESS_HANDLE_DND_TYPE,
      processes,
      flowline,
      backward,
    },
  });

  // const handleElement = useHandleManagement(
  //   onHandleMove,
  //   onHandleMoveEnd,
  //   sourceProcess,
  //   zoom,
  // );

  return (
    <div
      // ref={drag}
      id={id}
      style={{
        left: position.x,
        top: position.y,
        transformOrigin: `${FLOW_HANDLE_SIDE * translation.x}px ${
          FLOW_HANDLE_SIDE * translation.y
        }px`,
        transform: `translate(${FLOW_HANDLE_SIDE * translation.x}px,-${
          FLOW_HANDLE_SIDE * translation.y
        }px) rotate(${rotation}rad)`,
        ...style,
      }}
      className={flowHandleStyle(selected) + classNameOrEmpty(className)}
      data-nodrag={true}
    />
  );
}
