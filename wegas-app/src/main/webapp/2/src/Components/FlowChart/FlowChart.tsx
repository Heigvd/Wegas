import * as React from 'react';
import { css } from 'emotion';
import { XYPosition } from '../Hooks/useMouseEventDnd';
import { Toolbar } from '../Toolbar';
import {
  DefaultFlowLineComponent,
  FlowLineProps,
  TempFlowLine,
  TempFlowLineProps,
} from './FlowLineComponent';
import { ProcessProps, DefaultProcessComponent } from './ProcessComponent';
import { DnDFlowchartHandle, PROCESS_HANDLE_DND_TYPE } from './Handles';
import { useDrop } from 'react-dnd';
import { classNameOrEmpty } from '../../Helper/className';
import { Text } from '../Outputs/Text';
import { isActionAllowed } from '../PageComponents/tools/options';

const flowChartStyle = css({
  width: '100%',
  height: '100%',
  borderStyle: 'solid',
});

export interface Processes<F extends FlowLine, P extends Process<F>> {
  sourceProcess: P;
  targetProcess?: P;
}

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
  extends ClassStyleId,
    DisabledReadonly {
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
  onNew: (
    sourceProcess: P,
    newPosition: XYPosition,
    flowline?: F,
    backward?: boolean,
  ) => void;
  /**
   * a callback triggered when a flowline is requested
   * @example dropping a handle on a process
   */
  onConnect: (
    sourceProcess: P,
    targetProcess: P,
    flowline?: F,
    backward?: boolean,
  ) => void;
  /**
   * a callback triggered when a click occures on a process
   */
  onProcessClick?: (e: ModifierKeysEvent, process: P) => void;
  /**
   * a callback triggered when a click occures on a process
   */
  onFlowlineClick?: (
    e: ModifierKeysEvent,
    sourceProcess: P,
    flowline: F,
  ) => void;
  /**
   * a condition given by the user to see if flowline is selected or not
   */
  isFlowlineSelected?: (sourceProcess: P, flowline: F) => boolean;
  /**
   * a condition given by the user to see if process is selected or not
   */
  isProcessSelected?: (sourceProcess: P) => boolean;
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
  onProcessClick,
  onFlowlineClick,
  isFlowlineSelected,
  isProcessSelected,
  className,
  style,
  id,
  ...options
}: FlowChartProps<F, P>) {
  const container = React.useRef<HTMLDivElement>();
  const processesRef = React.useRef<{ [pid: string]: HTMLElement }>({});

  const [tempFlow, setTempFlow] = React.useState<TempFlowLineProps>();

  const [, drop] = useDrop<DnDFlowchartHandle<F, P>, unknown, void>({
    accept: PROCESS_HANDLE_DND_TYPE,
    collect: monitor => {
      if (monitor.getItem() == null) {
        setTempFlow(undefined);
      }
    },
    hover: (item, mon) => {
      const newX = mon.getClientOffset()?.x;
      const newY = mon.getClientOffset()?.y;

      const containerX = container.current?.getBoundingClientRect().x;
      const containerY = container.current?.getBoundingClientRect().y;

      let processElements: TempFlowLineProps['processElements'];
      if ('targetProcess' in item.processes) {
        processElements = {
          endProcessElement:
            processesRef.current[item.processes.targetProcess!.id],
        };
      } else {
        processElements = {
          startProcessElement:
            processesRef.current[item.processes.sourceProcess.id],
        };
      }

      if (
        newX != null &&
        newY != null &&
        containerX != null &&
        containerY != null
      ) {
        setTempFlow({
          position: { x: newX - containerX, y: newY - containerY },
          processElements,
        });
      } else {
        setTempFlow(undefined);
      }
    },
    canDrop: (_item, mon) => {
      return mon.isOver({ shallow: true });
    },
    drop: ({ processes, flowline, backward }, mon) => {
      setTempFlow(undefined);
      if (isActionAllowed(options)) {
        const newX = mon.getClientOffset()?.x;
        const newY = mon.getClientOffset()?.y;

        const containerX = container.current?.getBoundingClientRect().x;
        const containerY = container.current?.getBoundingClientRect().y;

        const scrollX = container.current?.scrollLeft;
        const scrollY = container.current?.scrollTop;

        onNew(
          processes.sourceProcess,
          newX != null &&
            newY != null &&
            containerX != null &&
            containerY != null &&
            scrollX != null &&
            scrollY != null
            ? {
                x: newX - containerX + scrollX,
                y: newY - containerY + scrollY,
              }
            : { x: 0, y: 0 },
          flowline,
          backward,
        );
      }
    },
  });

  const [internalProcesses, setInternalProcesses] = React.useState<{
    [pid: string]: P;
  }>(processes.reduce((o, p) => ({ ...o, [p.id]: p }), {}));

  React.useEffect(() => {
    setInternalProcesses(processes.reduce((o, p) => ({ ...o, [p.id]: p }), {}));
  }, [processes]);

  // Tricking the rendering to build flowline after the first render (onReady like move)
  // const [flows, setFlows] = React.useState<JSX.Element[][]>([]);
  const flows = React.useMemo(() => {
    const connections = Object.values(internalProcesses).reduce<
      Connection<F, P>[]
    >((o, process) => {
      const couples = process.connections
        .filter(flowline => internalProcesses[flowline.connectedTo] != null)
        .map(flowline => ({
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
    return groupedConnections.map(group =>
      group.map((c, i, g) => {
        return (
          <Flowline
            key={c.flowline.id + c.startProcess.id + c.endProcess.id}
            startProcessElement={processesRef.current[c.startProcess.id]}
            endProcessElement={processesRef.current[c.endProcess.id]}
            startProcess={c.startProcess}
            endProcess={c.endProcess}
            flowline={c.flowline}
            positionOffset={(i + 1) / (g.length + 1)}
            onClick={(e, p, f) =>
              isActionAllowed(options) &&
              onFlowlineClick &&
              onFlowlineClick(e, p, f)
            }
            isFlowlineSelected={isFlowlineSelected}
            {...options}
          />
        );
      }),
    );
  }, [internalProcesses, isFlowlineSelected, onFlowlineClick, options]);

  return (
    <Toolbar
      className={flowChartStyle + classNameOrEmpty(className)}
      style={style}
      id={id}
    >
      <Toolbar.Header>
        {typeof title === 'string' ? <Text text={title} /> : title}
      </Toolbar.Header>
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
        {tempFlow != null && <TempFlowLine {...tempFlow} />}
        {processes.map(process => (
          <Process
            key={process.id + JSON.stringify(process.position)}
            process={process}
            onReady={ref => {
              processesRef.current[process.id] = ref;
            }}
            onMove={position =>
              isActionAllowed(options) &&
              setInternalProcesses(op => ({
                ...op,
                [process.id]: { ...op[process.id], position },
              }))
            }
            onMoveEnd={position =>
              isActionAllowed(options) && onMove(process, position)
            }
            onConnect={(processes, flowline) => {
              setTempFlow(undefined);
              if (isActionAllowed(options)) {
                if ('targetProcess' in processes) {
                  onConnect(process, processes.sourceProcess, flowline, true);
                } else {
                  onConnect(processes.sourceProcess, process, flowline, false);
                }
              }
            }}
            onClick={(e, p) =>
              isActionAllowed(options) && onProcessClick && onProcessClick(e, p)
            }
            isProcessSelected={isProcessSelected}
            {...options}
          />
        ))}
      </Toolbar.Content>
    </Toolbar>
  );
}
