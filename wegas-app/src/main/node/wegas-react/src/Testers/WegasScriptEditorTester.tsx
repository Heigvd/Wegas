import * as React from 'react';
import { cx } from '@emotion/css';
import { flex, expandBoth, flexColumn } from '../css/classes';
import { EmbeddedSrcEditor } from '../Editor/Components/ScriptEditors/EmbeddedSrcEditor';
import { WegasScriptEditor } from '../Editor/Components/ScriptEditors/WegasScriptEditor';
// import { parse } from '@babel/parser';
// import { isFunctionDeclaration, isBlockStatement } from '@babel/types';

export default function WegasScriptEditorTester() {
  const [value, setValue] =
    React.useState(`runClientScript("Context.salut");runClientScript("Context.salut");runClientScript("Context.salut");
  runClientScript("Context.salut");
  runClientScript("Context.salut");runClientScript("Context.salut");
  runClientScript("Context.salut");`);

  return (
    <div className={cx(flex, expandBoth, flexColumn)}>
      <div style={{ height: '100%' }}>
        <EmbeddedSrcEditor
          scriptContext="Server internal"
          value={value}
          onChange={setValue}
          Editor={WegasScriptEditor}
        />
      </div>
    </div>
  );
}
