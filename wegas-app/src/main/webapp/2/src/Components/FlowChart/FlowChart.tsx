import * as React from 'react';
import { css } from 'emotion';
import { XYPosition } from '../Hooks/useMouseEventDnd';
import { Toolbar } from '../Toolbar';
import { FlowLineComponent, FlowLineProps } from './FlowLineComponent';
import { ProcessProps, ProcessComponent } from './ProcessComponent';
import { FlowLineLabelComponent, FlowLineLabelProps } from './FlowLineLabel';
import { DnDFlowchartHandle, PROCESS_HANDLE_DND_TYPE } from './ProcessHandle';
import { useDrop } from 'react-dnd';

const flowChartStyle = css({
  width: '100%',
  height: '100%',
  borderStyle: 'solid',
});

export interface FlowLine {
  id?: string;
  connectedTo: string;
}

export interface Process {
  id: string;
  position: XYPosition;
  connections: FlowLine[];
}

export interface Processes {
  [id: string]: Process;
}

export interface FlowLines {
  [id: string]: FlowLine;
}

interface Connection {
  startProcess: Process;
  endProcess: Process;
  flow: FlowLine;
}

interface FlowChartProps {
  title: React.ReactNode;
  processes: Process[];
  Process?: React.ForwardRefExoticComponent<
    ProcessProps & React.RefAttributes<HTMLElement>
  >;
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
  const processesRef = React.useRef<{ [pid: string]: HTMLElement }>({});

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
  });

  const [internalProcesses, setInternalProcesses] = React.useState<{
    [pid: string]: Process;
  }>(processes.reduce((o, p) => ({ ...o, [p.id]: p }), {}));

  React.useEffect(() => {
    setInternalProcesses(processes.reduce((o, p) => ({ ...o, [p.id]: p }), {}));
  }, [processes]);

  // Tricking the rendering to build flowline after the first render (onReady like move)
  const [flows, setFlows] = React.useState<JSX.Element[][]>([]);
  React.useEffect(() => {
    const connections = Object.values(internalProcesses).reduce<Connection[]>(
      (o, process) => {
        const couples = process.connections.map(flow => ({
          startProcess: process,
          endProcess: internalProcesses[flow.connectedTo],
          flow,
        }));
        return [...o, ...couples];
      },
      [],
    );

    // Grouping connections using the same waypoint (back and forth)
    const groupedConnections = Object.values(
      connections.reduce<{
        [coupleId: string]: Connection[];
      }>((o, c) => {
        const coupleId1 = c.startProcess.id + c.endProcess.id;
        const coupleId2 = c.endProcess.id + c.startProcess.id;
        if (o[coupleId1] != null) {
          return { ...o, [coupleId1]: [...o[coupleId1], c] };
        } else if (o[coupleId2] != null) {
          return { ...o, [coupleId2]: [...o[coupleId2], c] };
        } else {
          return { ...o, [coupleId1]: [c] };
        }
      }, {}),
    );

    // Making flowline from groups
    const flowLines = groupedConnections.map(group =>
      group.map((c, i, g) => {
        return (
          <Flowline
            key={c.flow.id}
            startProcessElement={processesRef.current[c.startProcess.id]}
            endProcessElement={processesRef.current[c.endProcess.id]}
            positionOffset={(i + 1) / (g.length + 1)}
          >
            <FlowlineLabel id={c.flow.id} label={c.flow.id} />
          </Flowline>
        );
      }),
    );
    setFlows(flowLines);
  }, [internalProcesses]);

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
        {flows}
        {processes.map(process => (
          <Process
            key={process.id + JSON.stringify(process.position)}
            process={process}
            onMove={position =>
              setInternalProcesses(op => ({
                ...op,
                [process.id]: { ...op[process.id], position },
              }))
            }
            onMoveEnd={position => onMove(process, position)}
            onConnect={(sourceProcess, flowId) => {
              onConnect(sourceProcess, process, flowId);
            }}
            ref={ref => {
              if (ref != null) {
                processesRef.current[process.id] = ref;
              }
            }}
          />
        ))}
      </Toolbar.Content>
    </Toolbar>
  );
}
