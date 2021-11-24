import { cx } from '@emotion/css';
import * as React from 'react';
import HTMLEditor from '../Components/HTML/HTMLEditor';
import { Toggler } from '../Components/Inputs/Boolean/Toggler';
import { expandBoth, flex, flexColumn } from '../css/classes';

export default function WegasScriptEditorTester() {
  const [enabled, setEnabled] = React.useState(true);
  return (
    <div className={cx(flex, expandBoth, flexColumn)}>
      <div style={{ height: '100%' }}>
        <Toggler value={enabled} onChange={setEnabled} />
        <HTMLEditor disabled={!enabled} />
      </div>
    </div>
  );
}
