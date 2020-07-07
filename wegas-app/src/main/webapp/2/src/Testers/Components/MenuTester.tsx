import * as React from 'react';
import { cx /*,css*/ } from 'emotion';
import { flex, flexColumn, grow, expandBoth } from '../../css/classes';
import { Menu, MenuItem } from '../../Components/Layouts/Menu';

export default function MenuTester() {
  return (
    <div className={cx(flex, flexColumn, expandBoth)}>
      <div className={grow}>
        <Menu>
          <MenuItem>Item1</MenuItem>
          <MenuItem unselectable>Item2 (unselectable)</MenuItem>
          <MenuItem>Item3</MenuItem>
        </Menu>
      </div>
      <div className={grow}>
        <Menu vertical>
          <MenuItem>Item1</MenuItem>
          <MenuItem unselectable>Item2 (unselectable)</MenuItem>
          <MenuItem>Item3</MenuItem>
        </Menu>
      </div>
    </div>
  );
}
