import { css, cx } from '@emotion/css';
import * as React from 'react';
import { useDrop } from 'react-dnd';
import {
  defaultMarginLeft,
  expandBoth,
  flex,
  flexRow,
} from '../../css/classes';
import { classNameOrEmpty } from '../../Helper/className';
import { XYPosition } from '../Hooks/useMouseEventDnd';
import { NumberSlider } from '../Inputs/Number/NumberSlider';
import { HTMLText } from '../Outputs/HTMLText';
import { isActionAllowed } from '../PageComponents/tools/options';
import { themeVar } from '../Theme/ThemeVars';
import { Toolbar } from '../Toolbar';
import {
  ArrowDefs,
  CircularFlowLine,
  computeFlowlineValues,
  DefaultFlowLineComponent,
  defaultSelect,
  FlowLineComponentProps,
  FlowLineComputedValues,
  FlowLineHandles,
  StraitFlowLine,
  TempFlowLine,
  TempFlowLineProps,
} from './FlowLineComponent';
import { DnDFlowchartHandle, PROCESS_HANDLE_DND_TYPE } from './Handles';
import {
  DefaultProcessComponent,
  ProcessComponentProps,
} from './ProcessComponent';

const legendStyle = css({
  position: 'absolute',
  left: 0,
  bottom: '15px',
});

const flowChartStyle = css({
  width: '100%',
  height: '100%',
});

const flowChartHeaderStyle = css({
  paddingLeft: '1.5em',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
});

const flowChartDisabledStyle = css({
  opacity: 0.5,
  backgroundColor: themeVar.colors.DisabledColor,
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

export interface Process<F extends FlowLine> extends ClassStyleId {
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
  /**
   * tells whether or not the process can be dragged
   */
  undraggable?: boolean;
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

interface FlowLineOptionalGroupedValues<
  F extends FlowLine,
  P extends Process<F>,
> {
  values: FlowLineComputedValues | undefined;
  selected: boolean;
  id: string;
  startProcess: P;
  endProcess: P;
  flowline: F;
  circular: boolean;
  startProcessElement: HTMLElement | undefined;
  offset: number;
}

interface FlowLineGroupedValues<F extends FlowLine, P extends Process<F>>
  extends Exclude<FlowLineOptionalGroupedValues<F, P>, 'values'> {
  values: FlowLineComputedValues;
}

export interface FlowChartProps<F extends FlowLine, P extends Process<F>>
  extends ClassStyleId,
    DisabledReadonly {
  /**
   * the title of the chart
   */
  title?: React.ReactNode;
  /**
   * the legend of the chart
   */
  legend?: React.ReactNode;
  /**
   * the processes in the chart
   */
  processes?: P[];
  /**
   * the component that displays processes
   */
  Process?: React.FunctionComponent<ProcessComponentProps<F, P>>;
  /**
   * the component that displays flowlines
   */
  Flowline?: React.FunctionComponent<FlowLineComponentProps<F, P>>;
  /**
   * a callback triggered when a component has been moved
   */
  onMove: (process: P, newPosition: XYPosition, e: MouseEvent) => void;
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
  legend,
  processes = emptyProcesses as P[],
  Process = DefaultProcessComponent,
  Flowline = DefaultFlowLineComponent,
  onMove,
  onNew,
  onConnect,
  onProcessClick,
  onFlowlineClick,
  isFlowlineSelected = defaultSelect,
  isProcessSelected,
  className,
  style,
  id,
  readOnly,
  disabled,
}: FlowChartProps<F, P>) {
  const actionsAllowed = isActionAllowed({ disabled, readOnly });

  const container = React.useRef<HTMLDivElement>();
  const processesRef = React.useRef<{ [pid: string]: HTMLElement }>({});

  const [tempFlow, setTempFlow] = React.useState<TempFlowLineProps>();
  const [zoom, setZoom] = React.useState<number>(1);

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
          zoom,
        });
      } else {
        setTempFlow(undefined);
      }
    },
    canDrop: (_item, mon) => {
      return mon.isOver({ shallow: false });
    },
    drop: ({ processes, flowline, backward }, mon) => {
      setTempFlow(undefined);
      if (actionsAllowed) {
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

  const [flowValues, setFlowValues] = React.useState<
    FlowLineGroupedValues<F, P>[]
  >([]);

  const drawFlows = React.useCallback(() => {
    try {
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

      const flowLineValues = groupedConnections.reduce<
        FlowLineGroupedValues<F, P>[]
      >(
        (o, group) => [
          ...o,
          ...group
            .map<FlowLineOptionalGroupedValues<F, P>>((c, i, g) => {
              const circular = c.startProcess === c.endProcess;
              const startProcessElement =
                processesRef.current[c.startProcess.id];
              const offset = (i + 1) / (g.length + 1);
              return {
                values: computeFlowlineValues(
                  startProcessElement,
                  processesRef.current[c.endProcess.id],
                  circular,
                  zoom,
                  offset,
                ),
                selected: isFlowlineSelected(c.startProcess, c.flowline),
                id: c.flowline.id + c.startProcess.id + c.endProcess.id,
                startProcess: c.startProcess,
                endProcess: c.endProcess,
                flowline: c.flowline,
                circular,
                startProcessElement,
                offset,
              };
            })
            .filter(function (
              v: FlowLineOptionalGroupedValues<F, P>,
            ): v is FlowLineGroupedValues<F, P> {
              return v.values != null;
            }),
        ],
        [],
      );

      setFlowValues(flowLineValues);
    } catch (e) {
      setFlowValues([]);
    }
  }, [internalProcesses, isFlowlineSelected, zoom]);

  React.useLayoutEffect(() => {
    drawFlows();
  }, [drawFlows]);

  return (
    <div className={expandBoth}>
      {legend != null && <div className={legendStyle}>{legend}</div>}
      <Toolbar
        className={
          cx(flowChartStyle, { [flowChartDisabledStyle]: disabled }) +
          classNameOrEmpty(className)
        }
        style={style}
        id={id}
      >
        <Toolbar.Header className={cx(flex, flexRow, flowChartHeaderStyle)}>
          {typeof title === 'string' ? <HTMLText text={title} /> : title}
          <NumberSlider
            min={0.1}
            max={1}
            steps={100}
            value={zoom}
            onChange={value => {
              setZoom(Number(value.toFixed(2)));
            }}
            className={defaultMarginLeft}
            displayValues="External"
          />
        </Toolbar.Header>
        <Toolbar.Content
          style={{ position: 'relative' }}
          ref={ref => {
            if (ref != null) {
              drop(ref);
              container.current = ref;
              // mo.observe(ref);
            }
          }}
        >
          <svg
            style={{
              zIndex: 0,
              position: 'absolute',
              left: 0,
              top: 0,
            }}
            ref={ref => {
              const parent = ref?.parentElement;
              if (ref != null && parent != null) {
                const parentBox = parent.getBoundingClientRect();
                ref.style.setProperty(
                  'width',
                  Math.max(parentBox.width, parent.scrollWidth) + 'px',
                );
                ref.style.setProperty(
                  'height',
                  Math.max(parentBox.height, parent.scrollHeight) + 'px',
                );
              }
            }}
          >
            <ArrowDefs />
            {flowValues.map(v => {
              return v.circular ? (
                <CircularFlowLine
                  key={v.id}
                  processElement={v.startProcessElement}
                  selected={v.selected}
                  positionOffset={v.offset}
                  zoom={zoom}
                />
              ) : (
                <StraitFlowLine
                  key={v.id}
                  flowlineValues={v.values.flowlineValues}
                  selected={v.selected}
                  zoom={zoom}
                />
              );
            })}
            {tempFlow != null && <TempFlowLine {...tempFlow} />}
          </svg>
          {flowValues.map(v => (
            <FlowLineHandles
              key={'Handle' + v.id}
              {...v.values.handlesValues}
              startProcess={v.startProcess}
              endProcess={v.endProcess}
              flowline={v.flowline}
              selected={v.selected}
            />
          ))}
          {flowValues.map(v => (
            <Flowline
              key={'Label' + v.id}
              position={v.values.labelValues.position}
              startProcess={v.startProcess}
              flowline={v.flowline}
              disabled={disabled}
              readOnly={readOnly}
              onClick={(e, p, f) =>
                isActionAllowed({ disabled, readOnly }) &&
                onFlowlineClick &&
                onFlowlineClick(e, p, f)
              }
              selected={v.selected}
              zoom={zoom}
            />
          ))}
          {processes.map((process /*, i, a*/) => (
            <Process
              key={process.id + JSON.stringify(process.position)}
              process={process}
              onReady={ref => {
                processesRef.current[process.id] = ref;
                // if (i === a.length - 1) {
                //   mo.observe(ref);
                // }
              }}
              onMove={position => {
                if (actionsAllowed) {
                  setInternalProcesses(op => ({
                    ...op,
                    [process.id]: { ...op[process.id], position },
                  }));
                }
              }}
              onMoveEnd={(position, e) =>
                actionsAllowed && onMove(process, position, e)
              }
              onConnect={(processes, flowline) => {
                setTempFlow(undefined);
                if (actionsAllowed) {
                  if ('targetProcess' in processes) {
                    onConnect(process, processes.sourceProcess, flowline, true);
                  } else {
                    onConnect(
                      processes.sourceProcess,
                      process,
                      flowline,
                      false,
                    );
                  }
                }
              }}
              onClick={(e, p) =>
                actionsAllowed && onProcessClick && onProcessClick(e, p)
              }
              isProcessSelected={isProcessSelected}
              disabled={disabled}
              readOnly={readOnly}
              zoom={zoom}
            />
          ))}
        </Toolbar.Content>
      </Toolbar>
    </div>
  );
}
