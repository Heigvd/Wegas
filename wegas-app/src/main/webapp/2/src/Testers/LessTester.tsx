import * as React from 'react';
import { cx } from 'emotion';
import { flex, expandBoth, flexColumn } from '../css/classes';
import { Button } from '../Components/Inputs/Buttons/Button';
// import * as less from 'less';

export default function LessTester() {
  return (
    <div className={cx(flex, expandBoth, flexColumn)}>
      <Button
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
