import * as React from 'react';
import { cx } from '@emotion/css';
import { flex, expandBoth, flexColumn, grow } from '../css/classes';
import { TextLoader, TumbleLoader } from '../Components/Loader';

export default function LoaderTester() {
  return (
    <div className={cx(flex, expandBoth, flexColumn)}>
      <div className={grow}>
        <TextLoader />
      </div>
      <div className={grow}>
        <TumbleLoader />
      </div>
    </div>
  );
}
