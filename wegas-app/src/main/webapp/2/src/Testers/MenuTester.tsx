import * as React from 'react';
import { expandBoth, flex, flexColumn } from '../css/classes';
import { cx } from 'emotion';
import { Menu } from '../Components/Menu';

export default function MenuTester() {
  const [selected, setSelected] = React.useState();

  return (
    <div className={cx(flex, expandBoth, flexColumn)}>
      <Menu
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
