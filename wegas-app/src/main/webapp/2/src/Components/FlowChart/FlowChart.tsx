import * as React from 'react';
import { css } from 'emotion';
import { XYPosition } from '../Hooks/useMouseEventDnd';
import { Toolbar } from '../Toolbar';
import { FlowLineComponent, FlowLineProps } from './FlowLineComponent';
import { ProcessProps, ProcessComponent } from './ProcessComponent';
import { FlowLineLabelComponent, FlowLineLabelProps } from './FlowLineLabel';
import { DnDFlowchartHandle, PROCESS_HANDLE_DND_TYPE } from './ProcessHandle';
import u from 'immer';
import { useDrop } from 'react-dnd';

const flowChartStyle = css({
  width: '100%',
  height: '100%',
  borderStyle: 'solid',
});

export interface Process {
  id?: string;
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
  processes: Process[];
  Process?: React.FunctionComponent<ProcessProps>;
  Flowline?: React.FunctionComponent<FlowLineProps>;
  FlowlineLabel?: React.FunctionComponent<FlowLineLabelProps>;
  onMove: (process: Process, newPosition: XYPosition) => void;
  onNew: (sourceProcess: Process, newPosition: XYPosition) => void;
  onConnect: (
    sourceProcess: Process,
    targetProcess: Process,
    flowId?: string | number,
  ) => void;
}

export function FlowChart({
  title,
  processes,
  Process = ProcessComponent,
  Flowline = FlowLineComponent,
  FlowlineLabel = FlowLineLabelComponent,
  onMove,
  onNew,
  onConnect,
}: FlowChartProps) {
  const container = React.useRef<HTMLDivElement>();
  const processesRef = React.useRef<HTMLElement[]>([]);

  const [, drop] = useDrop<DnDFlowchartHandle, unknown, unknown>({
    accept: PROCESS_HANDLE_DND_TYPE,
    canDrop: (_item, mon) => mon.isOver({ shallow: true }),
    drop: ({ sourceProcess }, mon) => {
      const newX = mon.getClientOffset()?.x;
      const newY = mon.getClientOffset()?.y;

      const containerX = container.current?.getBoundingClientRect().x;
      const containerY = container.current?.getBoundingClientRect().y;

      onNew(
        sourceProcess,
        newX != null && newY != null && containerX != null && containerY != null
          ? {
              x: newX - containerX,
              y: newY - containerY,
            }
          : { x: 0, y: 0 },
      );
    },
    // collect: (mon: DropTargetMonitor) => ({
    //   isOver: mon.isOver(),
    //   canDrop: mon.canDrop(),
    // }),
  });

  const [processesPosition, setProcessesPosition] = React.useState<
    XYPosition[]
  >([]);

  React.useEffect(() => {
    setProcessesPosition(processes.map(process => process.position));
  }, [processes]);

  return (
    <Toolbar className={flowChartStyle}>
      <Toolbar.Header>{title}</Toolbar.Header>
      <Toolbar.Content
        style={{ position: 'relative' }}
        ref={ref => {
          drop(ref);
          if (ref != null) {
            container.current = ref;
          }
        }}
      >
        {processes.map((process, index) =>
          process.attachedTo.map(flow => (
            <Flowline
              key={process.id + flow + index}
              startProcess={processesRef.current[index]}
              startProcessPosition={
                processesPosition[index] || process.position
              }
              endProcess={
                processesRef.current[processes.findIndex(p => p.id === flow)]
              }
              endProcessPosition={
                processesPosition[
                  processes.findIndex(process => process.id === flow)
                ] || processes.find(process => process.id === flow)?.position
              }
            >
              <FlowlineLabel id={process.id + flow} label={process.id + flow} />
            </Flowline>
          )),
        )}
        {processes.map((process, index) => (
          <Process
            key={process.id + JSON.stringify(process.position)}
            process={process}
            onMove={position =>
              setProcessesPosition(os =>
                u(os, os => {
                  os[processes.findIndex(p => p.id === process.id)] = position;
                  return os;
                }),
              )
            }
            onMoveEnd={position => onMove(process, position)}
            onConnect={(sourceProcess, flowId) => {
              onConnect(sourceProcess, process, flowId);
            }}
            onReady={ref => (processesRef.current[index] = ref)}
          />
        ))}
      </Toolbar.Content>
    </Toolbar>
  );
}
