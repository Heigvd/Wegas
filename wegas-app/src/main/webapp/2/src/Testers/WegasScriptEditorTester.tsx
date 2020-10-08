import * as React from 'react';
import { cx } from 'emotion';
import { flex, expandBoth, flexColumn } from '../css/classes';
import { WegasScriptEditor } from '../Editor/Components/ScriptEditors/WegasScriptEditor';
// import { parse } from '@babel/parser';
// import { isFunctionDeclaration, isBlockStatement } from '@babel/types';

export default function WegasScriptEditorTester() {
  const [value, setValue] = React.useState('');

  return (
    <div className={cx(flex, expandBoth, flexColumn)}>
      <div style={{ height: '50%' }}>
        <WegasScriptEditor
          args={[['test', ['string']]]}
          returnType={['string', 'number[]']}
          value={value}
          onChange={setValue}
        />
      </div>
      <div>{value}</div>
    </div>
  );
}
