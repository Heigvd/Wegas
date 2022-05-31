import { cx } from '@emotion/css';
import * as React from 'react';
import HTMLEditorMk2 from '../Components/HTML/HTMLEditorMk2';
import { Toggler } from '../Components/Inputs/Boolean/Toggler';
import { expandBoth, flex, flexColumn } from '../css/classes';

export default function WegasScriptEditorTester() {
  const [enabled, setEnabled] = React.useState(true);
  return (
    <div className={cx(flex, expandBoth, flexColumn)}>
      <div style={{ height: '100%' }}>
        <Toggler value={enabled} onChange={setEnabled} />
        <HTMLEditorMk2 disabled={!enabled} />
      </div>
    </div>
  );
}
