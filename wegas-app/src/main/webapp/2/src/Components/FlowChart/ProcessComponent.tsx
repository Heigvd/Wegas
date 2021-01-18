import * as React from 'react';
import { css } from 'emotion';
import { XYPosition, useMouseEventDnd } from '../Hooks/useMouseEventDnd';
import { themeVar } from '../Style/ThemeVars';
import { Process } from './FlowChart';
import {
  DnDFlowchartHandle,
  HANDLE_SIDE,
  ProcessHandle,
  PROCESS_HANDLE_DND_TYPE,
} from './ProcessHandle';
import { useDrop } from 'react-dnd';

const PROCESS_WIDTH = 100;
const PROCESS_HEIGHT = 50;

const processStyle = css({
  position: 'absolute',
  minWidth: `${PROCESS_WIDTH}px`,
  minHeight: `${PROCESS_HEIGHT}px`,
  backgroundColor: themeVar.Common.colors.ActiveColor,
  borderRadius: '10px',
  boxShadow: `5px 5px 5px ${themeVar.Common.colors.HeaderColor}`,
  cursor: 'move',
  userSelect: 'none',
  overflow: 'show',
});

export interface ProcessProps {
  process: Process;
  onMoveEnd: (postion: XYPosition) => void;
  onMove: (postion: XYPosition) => void;
  onConnect: (sourceProcess: Process, flowId?: string) => void;
  onReady: (element: HTMLElement) => void;
}

export function ProcessComponent({
  process,
  onMoveEnd,
  onMove,
  onConnect,
  onReady,
}: ProcessProps) {
  const processElement = React.useRef<HTMLDivElement | null>(null);
  const clickPosition = React.useRef<XYPosition>({ x: 0, y: 0 });

  const [, drop] = useDrop<DnDFlowchartHandle, unknown, unknown>({
    accept: PROCESS_HANDLE_DND_TYPE,
    canDrop: () => true,
    drop: ({ sourceProcess }) => {
      onConnect(sourceProcess);
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
    (_e: MouseEvent, position: XYPosition) => {
      onMove(position);
    },
    [onMove],
  );

  const onDragEnd = React.useCallback(
    (_e: MouseEvent, position: XYPosition) => {
      onMoveEnd({
        x: Math.max(position.x, 0),
        y: Math.max(position.y, 0),
      });
    },
    [onMoveEnd],
  );

  useMouseEventDnd(processElement, {
    onDragStart,
    onDrag,
    onDragEnd,
  });

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
      {process.id}
      <ProcessHandle
        position={{
          x: PROCESS_WIDTH - HANDLE_SIDE / 2,
          y: (PROCESS_HEIGHT - HANDLE_SIDE) / 2,
        }}
        sourceProcess={process}
      />
    </div>
  );
}
