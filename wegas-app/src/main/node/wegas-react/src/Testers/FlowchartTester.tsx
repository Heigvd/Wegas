import { cx } from '@emotion/css';
import * as React from 'react';
import {
  FlowChart,
  FlowLine,
  Process,
} from '../Components/FlowChart/FlowChart';
import { expandBoth, flex, flexColumn } from '../css/classes';
import { wlog } from '../Helper/wegaslog';

const processes: Process<FlowLine>[] = [
  {
    id: '1',
    position: {
      x: 0,
      y: 0,
    },
    connections: [
      {
        connectedTo: '2',
        id: '1',
      },
    ],
  },
  {
    id: '2',
    position: {
      x: 200,
      y: 200,
    },
    connections: [
      {
        connectedTo: '2',
        id: '1',
      },
    ],
  },
];

export default function FlowChartTester() {
  return (
    <div className={cx(flex, expandBoth, flexColumn)}>
      <div style={{ height: '100%' }}>
        <FlowChart
          title="Test flowchart"
          onConnect={wlog}
          onMove={wlog}
          onNew={wlog}
          processes={processes}
        />
      </div>
    </div>
  );
}
