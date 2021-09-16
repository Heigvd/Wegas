import * as React from 'react';
import { cx } from '@emotion/css';
import { flex, expandBoth, flexColumn } from '../css/classes';
import HTMLEditor from '../Components/HTML/HTMLEditor';
import { Toggler } from '../Components/Inputs/Boolean/Toggler';

export default function WegasScriptEditorTester() {
  const [show, setShow] = React.useState(false);
  return (
    <div className={cx(flex, expandBoth, flexColumn)}>
      <div style={{ height: '100%' }}>
        <HTMLEditor />
        <Toggler value={show} onChange={setShow} />
        <HTMLEditor value={String(show)} />
        {show && <HTMLEditor value={String(show)} />}
      </div>
    </div>
  );
}
