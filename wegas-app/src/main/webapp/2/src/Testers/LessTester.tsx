import * as React from 'react';
import { cx } from 'emotion';
import { flex, expandBoth, flexColumn } from '../css/classes';
import { Button } from '../Components/Inputs/Buttons/Button';

export default function LessTester() {
  return (
    <div className={cx(flex, expandBoth, flexColumn)}>
      <Button
        disableBorders={{ bottom: true }}
        // onClick={() => {
        //   less.refresh();
        // }}
      >
        Standard
      </Button>
      <Button disabled>Disabled</Button>
    </div>
  );
}
