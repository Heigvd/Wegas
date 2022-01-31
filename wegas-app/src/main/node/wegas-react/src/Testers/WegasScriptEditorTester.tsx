import { cx } from '@emotion/css';
import * as React from 'react';
import { expandBoth, flex, flexColumn } from '../css/classes';
import { WegasScriptEditor } from '../Editor/Components/ScriptEditors/WegasScriptEditor';
import { computePath } from '../Editor/Components/ScriptEditors/SrcEditor';

const testerPath = computePath(undefined, 'typescript');

export default function WegasScriptEditorTester() {
  const [value, setValue] = React.useState(
    `import {test} from "./test";\n"Est-ce que ça joue?"\n"Est-ce que ça joue ou comment?"`,
  );

  return (
    <div className={cx(flex, expandBoth, flexColumn)}>
      <div style={{ height: '100%' }}>
        <WegasScriptEditor
          models={{ [testerPath]: value }}
          fileName={testerPath}
          onChange={setValue}
          noGutter
          minimap={false}
          returnType={['string']}
        />
      </div>
    </div>
  );
}
