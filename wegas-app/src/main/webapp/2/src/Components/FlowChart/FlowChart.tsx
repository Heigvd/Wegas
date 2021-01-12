import * as React from 'react';
import { css } from 'emotion';
import { XYPosition } from '../Hooks/useMouseEventDnd';
import { Toolbar } from '../Toolbar';
import { FlowLineComponent, FlowLineProps } from './FlowLineComponent';
import { ProcessProps, ProcessComponent } from './ProcessComponent';
import { FlowLineLabelComponent, FlowLineLabelProps } from './FlowLineLabel';

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
  FlowlineLabel?: React.FunctionComponent<FlowLineLabelProps>;
  onChange: (processes: Processes) => void;
}

export function FlowChart({
  title,
  processes,
  Process = ProcessComponent,
  Flowline = FlowLineComponent,
  FlowlineLabel = FlowLineLabelComponent,
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

  return (
    <Toolbar className={flowChartStyle}>
      <Toolbar.Header>{title}</Toolbar.Header>
      <Toolbar.Content style={{ position: 'relative' }}>
        {Object.entries(processes).map(([key, process]) =>
          process.attachedTo.map(flow => (
            <Flowline
              key={key + flow}
              startProcess={processesRef.current[key]}
              startProcessPosition={processesPosition[key] || process.position}
              endProcess={processesRef.current[flow]}
              endProcessPosition={
                processesPosition[flow] || processes[flow].position
              }
            >
              <FlowlineLabel id={key + flow} label={key + flow} />
            </Flowline>
          )),
        )}
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
