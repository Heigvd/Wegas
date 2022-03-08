import { cx } from '@emotion/css';
import { useMonaco } from '@monaco-editor/react';
import * as React from 'react';
import { createOrUpdateModel } from '../Components/Contexts/LibrariesContext';
// import { transpile } from 'typescript';
// import { createOrUpdateModel } from '../Components/Contexts/LibrariesContext';
import { expandBoth, flex, flexColumn } from '../css/classes';
import SrcEditor from '../Editor/Components/ScriptEditors/SrcEditor';
import { wlog } from '../Helper/wegaslog';

export function header(returnType?: string[], args?: [string, string[]][]) {
  const cleanArgs =
    args !== undefined ? args.map(arg => arg.join(':')).join(',') : '';
  const cleanReturnType =
    returnType !== undefined
      ? returnType.reduce(
          (o, t, i) => o + (i ? '|' : '') + t.replace(/\r?\n/, ''),
          '',
        )
      : '';
  return `/* Please always respect the return type : ${cleanReturnType} */\n(${cleanArgs}) : ${cleanReturnType} => {`;
}

const defaultValue = `import {a} from "./test";
const b = a + 2`;

export default function ScriptParserTester() {
  const [value, setValue] = React.useState<string | undefined>(defaultValue);

  const reactMonaco = useMonaco();
  if (reactMonaco) {
    createOrUpdateModel(
      reactMonaco,
      'export const a : number = 2',
      'typescript',
      'test.d.ts',
    );
  }

  wlog(reactMonaco?.editor.getModels().map(model => model.uri.toString()));
  wlog(reactMonaco?.editor.getModels().length);

  return (
    <div className={cx(flex, expandBoth, flexColumn)}>
      <h3>In editor script</h3>
      <SrcEditor language={'typescript'} value={value} onChange={setValue} />
    </div>
  );
}
