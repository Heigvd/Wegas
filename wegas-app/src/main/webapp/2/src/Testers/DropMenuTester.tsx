import * as React from 'react';
import { expandBoth, flex, flexColumn } from '../css/classes';
import { cx } from 'emotion';
import {
  DropMenu,
  SelectedDropMenuItem,
  DropMenuItem,
} from '../Components/DropMenu';

type DropMenuTesterItemValue = { prop: string; schema: { name: string } };

export default function DropMenuTester() {
  const [selected, setSelected] = React.useState<
    SelectedDropMenuItem<
      DropMenuTesterItemValue,
      DropMenuItem<DropMenuTesterItemValue>
    >
  >();

  return (
    <div className={cx(flex, expandBoth, flexColumn)}>
      <DropMenu
        items={[
          {
            label: '1',
            value: { prop: 'p1', schema: { name: 'string' } },
            items: [
              {
                label: '1.1',
                value: { prop: 'p1.1', schema: { name: 'string' } },
              },
              {
                label: '1.2',
                value: { prop: 'p1.2', schema: { name: 'number' } },
              },
            ],
          },
          { label: '2', value: { prop: 'p2', schema: { name: 'object' } } },
        ]}
        onSelect={i => setSelected(i)}
      />
      <div>{JSON.stringify(selected)}</div>
    </div>
  );
}
