import * as React from 'react';
import { css } from 'emotion';
import { XYPosition } from '../Hooks/useMouseEventDnd';
import { Toolbar } from '../Toolbar';
import { DefaultFlowLineComponent, FlowLineProps } from './FlowLineComponent';
import { ProcessProps, DefaultProcessComponent } from './ProcessComponent';
import { DnDFlowchartHandle, PROCESS_HANDLE_DND_TYPE } from './ProcessHandle';
import { useDrop } from 'react-dnd';
import { classNameOrEmpty } from '../../Helper/className';

const flowChartStyle = css({
  width: '100%',
  height: '100%',
  borderStyle: 'solid',
});

export interface FlowLine {
  /**
   * the id of the flowline
   */
  id: string;
  /**
   * the id of the target process
   */
  connectedTo: string;
}

export interface Process<F extends FlowLine> {
  /**
   * the id of the process
   */
  id: string;
  /**
   * the position of the process
   */
  position: XYPosition;
  /**
   * the connections to other processes
   */
  connections: F[];
}

interface Connection<F extends FlowLine, P extends Process<F>> {
  /**
   * the source process
   */
  startProcess: P;
  /**
   * the target process
   */
  endProcess: P;
  /**
   * the flowline object use for the connection
   */
  flowline: F;
}

export interface FlowChartProps<F extends FlowLine, P extends Process<F>>
  extends ClassStyleId {
  /**
   * the title of the chart
   */
  title?: React.ReactNode;
  /**
   * the processes in the chart
   */
  processes?: P[];
  /**
   * the component that displays processes
   */
  Process?: React.FunctionComponent<ProcessProps<F, P>>;
  /**
   * the component that displays flowlines
   */
  Flowline?: React.FunctionComponent<FlowLineProps<F, P>>;
  /**
   * a callback triggered when a component has been moved
   */
  onMove: (process: P, newPosition: XYPosition) => void;
  /**
   * a callback triggered when a new process is requested
   * @example dropping a handle on the main board
   */
  onNew: (sourceProcess: P, newPosition: XYPosition, flowline?: F) => void;
  /**
   * a callback triggered when a flowline is requested
   * @example dropping a handle on a process
   */
  onConnect: (sourceProcess: P, targetProcess: P, flowline?: F) => void;
}

const emptyProcesses: Process<FlowLine>[] = [];

export function FlowChart<F extends FlowLine, P extends Process<F>>({
  title,
  processes = emptyProcesses as P[],
  Process = DefaultProcessComponent,
  Flowline = DefaultFlowLineComponent,
  onMove,
  onNew,
  onConnect,
  className,
  style,
  id,
}: FlowChartProps<F, P>) {
  const container = React.useRef<HTMLDivElement>();
  const processesRef = React.useRef<{ [pid: string]: HTMLElement }>({});

  const [, drop] = useDrop<DnDFlowchartHandle<F, P>, unknown, unknown>({
    accept: PROCESS_HANDLE_DND_TYPE,
    canDrop: (_item, mon) => mon.isOver({ shallow: true }),
    drop: ({ sourceProcess, flowline }, mon) => {
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
        flowline,
      );
    },
  });

  const [internalProcesses, setInternalProcesses] = React.useState<{
    [pid: string]: P;
  }>(processes.reduce((o, p) => ({ ...o, [p.id]: p }), {}));

  React.useEffect(() => {
    setInternalProcesses(processes.reduce((o, p) => ({ ...o, [p.id]: p }), {}));
  }, [processes]);

  // Tricking the rendering to build flowline after the first render (onReady like move)
  const [flows, setFlows] = React.useState<JSX.Element[][]>([]);
  React.useEffect(() => {
    const connections = Object.values(internalProcesses).reduce<
      Connection<F, P>[]
    >((o, process) => {
      const couples = process.connections.map(flowline => ({
        startProcess: process,
        endProcess: internalProcesses[flowline.connectedTo],
        flowline,
      }));
      return [...o, ...couples];
    }, []);

    // Grouping connections using the same waypoint (back and forth)
    const groupedConnections = Object.values(
      connections.reduce<{
        [coupleId: string]: Connection<F, P>[];
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
            key={c.flowline.id}
            startProcessElement={processesRef.current[c.startProcess.id]}
            endProcessElement={processesRef.current[c.endProcess.id]}
            startProcess={c.startProcess}
            flowline={c.flowline}
            positionOffset={(i + 1) / (g.length + 1)}
          />
        );
      }),
    );
    setFlows(flowLines);
  }, [internalProcesses]);

  return (
    <Toolbar
      className={flowChartStyle + classNameOrEmpty(className)}
      style={style}
      id={id}
    >
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
            onReady={ref => {
              processesRef.current[process.id] = ref;
            }}
            onMove={position =>
              setInternalProcesses(op => ({
                ...op,
                [process.id]: { ...op[process.id], position },
              }))
            }
            onMoveEnd={position => onMove(process, position)}
            onConnect={(sourceProcess, flowline) => {
              onConnect(sourceProcess, process, flowline);
            }}
          />
        ))}
      </Toolbar.Content>
    </Toolbar>
  );
}
