import { cx } from 'emotion';
import * as React from 'react';
import { FlowChart, Process } from '../Components/FlowChart/FlowChart';
import { flex, flexColumn } from '../css/classes';
import u from 'immer';
import { wlog } from '../Helper/wegaslog';

const testProcesses: Process[] = [
  {
    id: '1',
    position: { x: 50, y: 50 },
    connections: [
      { id: '1', connectedTo: '2' },
      { id: '2', connectedTo: '3' },
      { id: '3', connectedTo: '2' },
    ],
  },
  {
    id: '2',
    position: { x: 400, y: 400 },
    connections: [
      { id: '4', connectedTo: '3' },
      { id: '6', connectedTo: '1' },
    ],
  },
  {
    id: '3',
    position: { x: 400, y: 50 },
    connections: [{ id: '5', connectedTo: '1' }],
  },
];

let lastProcessId = 3;
let lastFlowId = 6;

export default function FlowChartTester() {
  const [state, setState] = React.useState(testProcesses);

  return (
    <div className={cx(flex, flexColumn)}>
      <FlowChart
        title="Test flow chart"
        processes={state}
        onMove={(process, newPosition) => {
          wlog('New position');
          setState(oldState =>
            u(oldState, oldState => {
              const newState = oldState.find(p => p.id === process.id);
              if (newState != null) {
                newState.position = newPosition;
              }
              return oldState;
            }),
          );
        }}
        onNew={(sourceProcess, newPosition, flow) => {
          setState(oldState =>
            u(oldState, oldState => {
              const oldProcess = oldState.find(p => p.id === sourceProcess.id);
              oldState.push({
                id: String(++lastProcessId),
                position: newPosition,
                connections: [],
              });
              if (oldProcess != null) {
                if (flow == null) {
                  oldProcess.connections.push({
                    id: String(++lastFlowId),
                    connectedTo: String(lastProcessId),
                  });
                } else {
                  const oldConnextionIndex = oldProcess.connections.findIndex(
                    connection => connection.id === flow.id,
                  );
                  oldProcess.connections.splice(oldConnextionIndex, 1, {
                    ...flow,
                    connectedTo: String(lastProcessId),
                  });
                }
              }
              return oldState;
            }),
          );
        }}
        onConnect={(sourceProcess, targetProcess, flow) => {
          setState(oldState =>
            u(oldState, oldState => {
              const oldProcess = oldState.find(p => p.id === sourceProcess.id);

              // If new flow
              if (flow == null) {
                if (oldProcess != null && targetProcess.id != null) {
                  oldProcess.connections.push({
                    id: String(++lastFlowId),
                    connectedTo: targetProcess.id,
                  });
                }
              }
              // If moving flow
              else {
                const oldProcess = oldState.find(
                  process => process.id === sourceProcess.id,
                );
                const flowIndex = oldProcess?.connections.findIndex(
                  connection => connection.id === flow.id,
                );
                if (flowIndex != null && flowIndex !== -1) {
                  oldProcess?.connections.splice(flowIndex, 1, {
                    ...flow,
                    connectedTo: targetProcess.id,
                  });
                }
              }
              return oldState;
            }),
          );
        }}
      />
      <div>{JSON.stringify(state)}</div>
    </div>
  );
}
