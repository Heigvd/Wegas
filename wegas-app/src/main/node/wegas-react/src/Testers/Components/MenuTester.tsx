import { cx /*,css*/ } from '@emotion/css';
import * as React from 'react';
import { Menu } from '../../Components/Layouts/Menu';
import { expandBoth, flex, flexColumn, grow } from '../../css/classes';

export default function MenuTester() {
  return (
    <div className={cx(flex, flexColumn, expandBoth)}>
      <div className={grow}>
        <Menu
          items={{
            Item1: { label: 'Item1', content: <div>Item1</div> },
            Item2: { label: 'Item2', content: <div>Item2</div> },
            Item3: { label: 'Item3', content: <div>Item3</div> },
          }}
        />
      </div>
      <div className={grow}>
        <Menu
          vertical
          items={{
            Item1: { label: 'Item1', content: <div>Item1</div> },
            Item2: { label: 'Item2', content: <div>Item2</div> },
            Item3: { label: 'Item3', content: <div>Item3</div> },
          }}
        />
      </div>
    </div>
  );
}
