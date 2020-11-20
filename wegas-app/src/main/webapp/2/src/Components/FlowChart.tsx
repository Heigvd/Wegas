import { css } from 'emotion';
import * as React from 'react';
import { wlog } from '../Helper/wegaslog';
import { DefaultDndProvider } from './Contexts/DefaultDndProvider';
import {
  MouseDnDHandler,
  XYPosition,
  useMouseEventDnd,
} from './Hooks/useMouseEventDnd';
import { themeVar } from './Style/ThemeVars';
import { Toolbar } from './Toolbar';

const flowChartStyle = css({
  width: '100%',
  height: '100%',
  borderStyle: 'solid',
});

export interface Process {
  position: XYPosition;
  attachedTo: string[];
}

export interface Processes {
  [id: string]: Process;
}

export interface FlowLine {
  startingStateId: string | number;
  endingStateId: string | number;
}

export interface FlowLines {
  [id: string]: FlowLine;
}

interface FlowChartProps {
  title: React.ReactNode;
  processes: Processes;
  Process?: React.FunctionComponent<ProcessProps>;
  Flowline?: React.FunctionComponent<FlowLineProps>;
  onChange: (processes: Processes) => void;
}

export function FlowChart({
  title,
  processes,
  Process = ProcessComponent,
  Flowline = FlowLineComponent,
  onChange,
}: FlowChartProps) {
  const processesRef = React.useRef<{
    [key: string]: HTMLElement;
  }>({});

  const [processesPosition, setProcessesPosition] = React.useState<{
    [key: string]: XYPosition;
  }>({});

  React.useEffect(() => {
    setProcessesPosition(
      Object.entries(processes).reduce(
        (os, [key, process]) => ({ ...os, [key]: process.position }),
        {},
      ),
    );
  }, [processes]);

  const [flows, setFlows] = React.useState<JSX.Element[][]>([]);

  React.useEffect(() => {
    setFlows(
      Object.entries(processes).map(([key, process]) =>
        process.attachedTo.map(flow => (
          <Flowline
            key={key + flow}
            startProcess={processesRef.current[key]}
            startProcessPosition={processesPosition[key] || process.position}
            endProcess={processesRef.current[flow]}
            endProcessPosition={
              processesPosition[flow] || processes[flow].position
            }
          />
        )),
      ),
    );
  }, [processes, processesPosition]);

  return (
    <Toolbar className={flowChartStyle}>
      <Toolbar.Header>{title}</Toolbar.Header>
      <Toolbar.Content style={{ position: 'relative' }}>
        <svg style={{ position: 'absolute', width: '100%', height: '100%' }}>
          {flows}
        </svg>
        {Object.entries(processes).map(([key, process]) => (
          <Process
            key={key + JSON.stringify(process.position)}
            id={key}
            position={process.position}
            attachedTo={process.attachedTo}
            onMove={position =>
              setProcessesPosition(os => ({ ...os, [key]: position }))
            }
            onMoveEnd={position =>
              onChange({ ...processes, [key]: { ...process, position } })
            }
            onNew={position => {
              const newId = String(
                Number(Object.keys(processes).sort().slice(-1)[0]) + 1,
              );
              onChange({
                ...processes,
                [key]: {
                  ...process,
                  attachedTo: [...process.attachedTo, newId],
                },
                [newId]: {
                  position,
                  attachedTo: [],
                },
              });
            }}
            onReady={ref => (processesRef.current[key] = ref)}
          />
        ))}
      </Toolbar.Content>
    </Toolbar>
  );
}

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

interface ProcessProps extends Process {
  id: string;
  onMoveEnd: (postion: XYPosition) => void;
  onMove: (postion: XYPosition) => void;
  onNew: (position: XYPosition) => void;
  onReady: (element: HTMLElement) => void;
}

export function ProcessComponent({
  id,
  position,
  onMoveEnd,
  onMove,
  onNew,
  onReady,
}: ProcessProps) {
  const processElement = React.useRef<HTMLDivElement | null>(null);
  const clickPosition = React.useRef<XYPosition>({ x: 0, y: 0 });

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

  const onHandleDragEnd = React.useCallback(
    (_e: MouseEvent, componentPosition: XYPosition) => {
      const x = position.x + componentPosition.x;
      const y = position.y + componentPosition.y;
      onNew({ x: Math.max(x, 0), y: Math.max(y, 0) });
      return true;
    },
    [onNew, position.x, position.y],
  );

  return (
    <div
      ref={ref => {
        if (ref != null) {
          processElement.current = ref;
          onReady(ref);
        }
      }}
      style={{ left: position.x, top: position.y }}
      className={processStyle}
    >
      {id}
      <ProcessHandle
        position={{
          x: PROCESS_WIDTH - HANDLE_SIDE / 2,
          y: (PROCESS_HEIGHT - HANDLE_SIDE) / 2,
        }}
        handlers={{ onDragEnd: onHandleDragEnd }}
      />
    </div>
  );
}

const HANDLE_SIDE = 20;

const flowHandleStyle = css({
  position: 'absolute',
  width: `${HANDLE_SIDE}px`,
  height: `${HANDLE_SIDE}px`,
  borderRadius: `${HANDLE_SIDE / 2}px`,
  backgroundColor: themeVar.Common.colors.WarningColor,
  opacity: 0.2,
  ':hover': { opacity: 1 },
});

interface ProcessHandleProps {
  position: XYPosition;
  handlers: MouseDnDHandler;
}

function ProcessHandle({ position, handlers }: ProcessHandleProps) {
  const handleElement = React.useRef<HTMLDivElement>(null);
  useMouseEventDnd(handleElement, handlers);

  return (
    <div
      ref={handleElement}
      style={{
        left: position.x,
        top: position.y,
      }}
      className={flowHandleStyle}
    />
  );
}

const flowLineStyle = css({
  position: 'absolute',
  backgroundColor: 'yellow',
});

interface FlowLineProps {
  startProcess: HTMLElement;
  startProcessPosition: XYPosition;
  endProcess: HTMLElement;
  endProcessPosition: XYPosition;
}

interface Values {
  arrowStart: XYPosition;
  arrowEnd: XYPosition;
  arrowLength: number;
  arrowLeftCorner: XYPosition;
  arrowRightCorner: XYPosition;
}

interface AxeValues {
  LEFT: Values;
  TOP: Values;
  RIGHT: Values;
  BOTTOM: Values;
}

type Axe = keyof AxeValues;

export function FlowLineComponent({
  startProcess,
  startProcessPosition,
  endProcess,
  endProcessPosition,
}: FlowLineProps) {
  const startProcessBox = startProcess.getBoundingClientRect();

  const startLeft = startProcessPosition.x;
  const startTop = startProcessPosition.y;
  const startWidth = startProcessBox.width;
  const startHeight = startProcessBox.height;

  const startPointLeft: XYPosition = {
    x: startLeft,
    y: startTop + startHeight / 2,
  };
  const startPointTop: XYPosition = {
    x: startLeft + startWidth / 2,
    y: startTop,
  };
  const startPointRight: XYPosition = {
    x: startLeft + startWidth,
    y: startTop + startHeight / 2,
  };
  const startPointBottom: XYPosition = {
    x: startLeft + startWidth / 2,
    y: startTop + startHeight,
  };

  const endProcessBox = endProcess.getBoundingClientRect();

  const endLeft = endProcessPosition.x;
  const endTop = endProcessPosition.y;
  const endWidth = endProcessBox.width;
  const endHeight = endProcessBox.height;

  const endPointLeft: XYPosition = { x: endLeft, y: endTop + endHeight / 2 };
  const endPointTop: XYPosition = { x: endLeft + endWidth / 2, y: endTop };
  const endPointRight: XYPosition = {
    x: endLeft + endWidth,
    y: endTop + endHeight / 2,
  };
  const endPointBottom: XYPosition = {
    x: endLeft + endWidth / 2,
    y: endTop + endHeight,
  };

  const leftArrowLength =
    Math.pow(startPointLeft.x - endPointRight.x, 2) +
    Math.pow(startPointLeft.y - endPointRight.y, 2);
  const topArrowLength =
    Math.pow(startPointTop.x - endPointBottom.x, 2) +
    Math.pow(startPointTop.y - endPointBottom.y, 2);

  const rightArrowLength =
    Math.pow(startPointRight.x - endPointLeft.x, 2) +
    Math.pow(startPointRight.y - endPointLeft.y, 2);

  const bottomArrowLength =
    Math.pow(startPointBottom.x - endPointTop.x, 2) +
    Math.pow(startPointBottom.y - endPointTop.y, 2);

  const arrowLength: { length: number; axe: Axe }[] = [
    { length: leftArrowLength, axe: 'LEFT' },
    { length: topArrowLength, axe: 'TOP' },
    { length: rightArrowLength, axe: 'RIGHT' },
    { length: bottomArrowLength, axe: 'BOTTOM' },
  ];

  const axeValues: AxeValues = {
    LEFT: {
      arrowStart: startPointLeft,
      arrowEnd: endPointRight,
      arrowLength: leftArrowLength,
      arrowLeftCorner: { x: endPointRight.x + 5, y: endPointRight.y - 5 },
      arrowRightCorner: { x: endPointRight.x + 5, y: endPointRight.y + 5 },
    },
    TOP: {
      arrowStart: startPointTop,
      arrowEnd: endPointBottom,
      arrowLength: topArrowLength,
      arrowLeftCorner: { x: endPointRight.x + 5, y: endPointRight.y + 5 },
      arrowRightCorner: { x: endPointRight.x - 5, y: endPointRight.y + 5 },
    },
    RIGHT: {
      arrowStart: startPointRight,
      arrowEnd: endPointLeft,
      arrowLength: rightArrowLength,
      arrowLeftCorner: { x: endPointRight.x - 5, y: endPointRight.y + 5 },
      arrowRightCorner: { x: endPointRight.x - 5, y: endPointRight.y - 5 },
    },
    BOTTOM: {
      arrowStart: startPointBottom,
      arrowEnd: endPointTop,
      arrowLength: bottomArrowLength,
      arrowLeftCorner: { x: endPointRight.x + 5, y: endPointRight.y - 5 },
      arrowRightCorner: { x: endPointRight.x - 5, y: endPointRight.y - 5 },
    },
  };

  const shortestArrow = arrowLength.sort((a, b) => a.length - b.length)[0];
  const values = axeValues[shortestArrow.axe];

  const left = Math.min(values.arrowStart.x, values.arrowEnd.x);
  const top = Math.min(values.arrowStart.y, values.arrowEnd.y);
  const width = Math.abs(values.arrowStart.x - values.arrowEnd.x);
  const height = Math.abs(values.arrowStart.y - values.arrowEnd.y);

  return (
    <>
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="10"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" />
        </marker>
      </defs>
      <line
        x1={values.arrowStart.x}
        y1={values.arrowStart.y}
        x2={values.arrowEnd.x}
        y2={values.arrowEnd.y}
        style={{ stroke: 'rgb(255,0,0)', strokeWidth: 2 }}
        markerEnd="url(#arrowhead)"
      />
      {/* <path
        d={`M${values.arrowEnd.x} ${values.arrowEnd.y} L${values.arrowLeftCorner.x} ${values.arrowLeftCorner.y} L${values.arrowRightCorner.x} ${values.arrowRightCorner.y} Z`}
      /> */}
      <div
        className={flowLineStyle}
        style={{
          left,
          top,
          width,
          height,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: values.arrowStart.x,
          top: values.arrowStart.y,
          backgroundColor: 'green',
          width: '10px',
          height: '10px',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: values.arrowEnd.x,
          top: values.arrowEnd.y,
          backgroundColor: 'red',
          width: '10px',
          height: '10px',
        }}
      />
    </>
  );
}
