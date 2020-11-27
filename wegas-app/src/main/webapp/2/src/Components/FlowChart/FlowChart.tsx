import { css } from 'emotion';
import * as React from 'react';
import { XYPosition } from '../Hooks/useMouseEventDnd';
import { Toolbar } from '../Toolbar';
import { Processes, ProcessProps, ProcessComponent } from './Process';
import { FlowLineProps, FlowLineComponent } from './FlowLine';

const flowChartStyle = css({
  width: '100%',
  height: '100%',
  borderStyle: 'solid',
});

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
