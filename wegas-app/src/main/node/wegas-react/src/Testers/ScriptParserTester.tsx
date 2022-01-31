import { cx } from '@emotion/css';
import * as React from 'react';
import { transpile } from 'typescript';
import { expandBoth, flex, flexColumn, grow } from '../css/classes';
import { MessageString } from '../Editor/Components/MessageString';
import {
  defunctionalizeScript,
  insertReturn,
  functionalizeScript,
  WegasScriptEditor,
} from '../Editor/Components/ScriptEditors/WegasScriptEditor';
import { wlog } from '../Helper/wegaslog';
import { computePath } from '../Editor/Components/ScriptEditors/SrcEditor';

export function header(
  returnType?: string[],
  args?: [string, WegasScriptEditorReturnTypeName[]][],
) {
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
//
//export const formatScriptToFunctionBody = (
//  val: string,
//  dropBlankLines: boolean = false,
//) => {
//  const lines = textToArray(val, dropBlankLines);
//
//  if (lines.length > 0) {
//    const lastLine = lines.pop()!;
//
//    if (!lastLine.includes('return')) {
//      // insert "return"
//      lines.push('return ' + lastLine);
//    }
//  } else {
//    // insert "return"
//    lines.push('return');
//  }
//
//  return arrayToText(lines.map(line => '\t' + line));
//};
//
//
const inEditorPath = computePath(undefined, 'typescript');
const initialPath = computePath(undefined, 'typescript');
const funcPath = computePath(undefined, 'typescript');
const defuncPath = computePath(undefined, 'typescript');
const transPath = computePath(undefined, 'typescript');

const RETURN_TYPES: WegasScriptEditorReturnTypeName[] = ['string'];

export default function ScriptParserTester() {
  const [value, setValue] = React.useState(
    `import {test} from "./test";
"hello " + test`,
  );

  const functionalized = functionalizeScript(value, RETURN_TYPES);
  const defunctionalized = defunctionalizeScript(functionalized);
  const transpiled = insertReturn(transpile(defunctionalized));
  wlog('Value: ', value);

  return (
    <div className={cx(flex, expandBoth, flexColumn)}>
      <div className={cx(grow, flex)}>
        <div className={cx(grow, flex, flexColumn)}>
          <h3>In editor script</h3>
          <WegasScriptEditor
            models={{ [inEditorPath]: value }}
            fileName={inEditorPath}
            onChange={setValue}
            noGutter
            minimap={false}
            returnType={RETURN_TYPES}
            language="typescript"
          />
        </div>
        <div className={cx(grow, flex, flexColumn)}>
          <h3>Raw script</h3>
          <WegasScriptEditor
            models={{ [initialPath]: value }}
            fileName={initialPath}
            noGutter
            minimap={false}
            readOnly
            language="typescript"
          />
        </div>
      </div>
      <div className={cx(grow, flex)}>
        <div className={cx(grow, flex, flexColumn)}>
          <h3>Functionalized script</h3>
          <WegasScriptEditor
            models={{ [funcPath]: functionalized }}
            fileName={funcPath}
            noGutter
            minimap={false}
            readOnly
            language="typescript"
          />
        </div>
        <div className={cx(grow, flex, flexColumn)}>
          <MessageString
            type={value === defunctionalized ? 'succes' : 'warning'}
            value={
              value === defunctionalized
                ? 'Defunctionalized script equals initial script'
                : 'Defunctionalized script is different from initial script'
            }
          />
          <WegasScriptEditor
            models={{ [defuncPath]: defunctionalized }}
            fileName={defuncPath}
            noGutter
            minimap={false}
            readOnly
            language="typescript"
          />
        </div>
      </div>
      <div className={cx(grow, flex)}>
        <div className={cx(grow, flex, flexColumn)}>
          <h3>Transpiled script</h3>
          <WegasScriptEditor
            models={{ [transPath]: transpiled }}
            fileName={transPath}
            noGutter
            minimap={false}
            readOnly
            language="javascript"
          />
        </div>
        <div className={cx(grow, flex, flexColumn)}>
          <h3>In editor script Dual</h3>
          <WegasScriptEditor
            models={{}}
            fileName="lib.dom.d.ts"
            onChange={setValue}
            noGutter
            minimap={false}
            returnType={RETURN_TYPES}
            language="typescript"
          />
        </div>
      </div>
    </div>
  );
}
