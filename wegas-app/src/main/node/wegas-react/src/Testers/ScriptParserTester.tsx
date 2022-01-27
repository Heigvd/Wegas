import { cx } from '@emotion/css';
import * as React from 'react';
import {
  createSourceFile,
  isArrowFunction,
  isBlock,
  isExpressionStatement,
  isImportDeclaration,
  isReturnStatement,
  isSourceFile,
  ScriptTarget,
  transpile,
} from 'typescript';
import { expandBoth, flex, flexColumn, flexRow, grow } from '../css/classes';
import { MessageString } from '../Editor/Components/MessageString';
import {
  arrayToText,
  textToArray,
} from '../Editor/Components/ScriptEditors/editorHelpers';
import {
  footer,
  // formatScriptToFunctionBody,
  WegasScriptEditor,
} from '../Editor/Components/ScriptEditors/WegasScriptEditor';

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

export const formatScriptToFunctionBody = (
  val: string,
  dropBlankLines: boolean = false,
) => {
  const lines = textToArray(val, dropBlankLines);

  if (lines.length > 0) {
    const lastLine = lines.pop()!;

    if (!lastLine.includes('return')) {
      // insert "return"
      lines.push('return ' + lastLine);
    }
  } else {
    // insert "return"
    lines.push('return');
  }

  return arrayToText(lines.map(line => '\t' + line));
};

function functionalizeScript(
  nakedScript: string,
  returnType?: WegasScriptEditorReturnTypeName[],
  args?: [string, WegasScriptEditorReturnTypeName[]][],
) {
  const sourceFile = createSourceFile(
    'Testedfile',
    nakedScript,
    ScriptTarget.ESNext,
    true,
  );

  if (isSourceFile(sourceFile)) {
    let startPosition = 0;

    // Find the last import before another statement
    for (const statement of sourceFile.statements) {
      // If new import found, push the startPosition at the end of the statement
      if (isImportDeclaration(statement)) {
        startPosition = statement.end;
      }
      // If another statement is found, stop searching
      else {
        break;
      }
    }
    if (returnType !== undefined && returnType.length > 0) {
      const imports = nakedScript.substring(0, startPosition);
      const body = formatScriptToFunctionBody(
        nakedScript.substring(startPosition, nakedScript.length),
      );

      return `${imports}\n${header(returnType, args)}${body}${footer()}`;
    } else {
      return nakedScript;
    }
  } else {
    return nakedScript;
  }
}

function defunctionalizeScript(functionalizedScript: string): string {
  const sourceFile = createSourceFile(
    'Testedfile',
    functionalizedScript,
    ScriptTarget.ESNext,
    true,
  );

  if (isSourceFile(sourceFile)) {
    let lastImportPostion = 0;
    // Find the last import before another statement
    for (const statement of sourceFile.statements) {
      // If new import found, push the startPosition at the end of the statement
      if (isImportDeclaration(statement)) {
        lastImportPostion = statement.end;
      }
      // If another statement is found, stop searching
      else {
        break;
      }
    }

    let startBodyPosition = lastImportPostion;
    // let stopBodyPosition = functionalizedScript.length;
    let startReturnPosition = functionalizedScript.length;
    let stopReturnPosition = startReturnPosition;
    //Find the start and stop of the body
    for (const fileStatement of sourceFile.statements) {
      // If new import found, push the startPosition at the end of the statement
      if (
        isExpressionStatement(fileStatement) &&
        isArrowFunction(fileStatement.expression) &&
        isBlock(fileStatement.expression.body)
      ) {
        startBodyPosition = fileStatement.expression.body.getStart() + 1;
        // stopBodyPosition = fileStatement.expression.body.end - 1;

        for (const functionStatement of fileStatement.expression.body
          .statements) {
          if (isReturnStatement(functionStatement)) {
            startReturnPosition = functionStatement.getStart();
            stopReturnPosition = fileStatement.expression.body.end - 1;
          }
        }
      }
    }

    const imports = functionalizedScript.substring(0, lastImportPostion);
    const body = functionalizedScript.substring(
      startBodyPosition,
      startReturnPosition,
    );
    //Removing return keyword
    const returnStatement = functionalizedScript
      .substring(startReturnPosition, stopReturnPosition)
      .replace('return ', '');
    // Removing tabs in the body
    const untabedBodyLines = arrayToText(
      textToArray(body + returnStatement).map(line => line.substring(1)),
    );
    // Removing return in the last line

    return imports + untabedBodyLines;
  } else {
    return functionalizedScript;
  }
}

const RETURN_TYPES: WegasScriptEditorReturnTypeName[] = ['string'];

export default function ScriptParserTester() {
  const [value, setValue] = React.useState(
    `import {test} from "./test";
/*Tralala*/
"Est-ce que ça joue?"
function test(){
  return "salut!";
}
import {moche} from "./moche";
"Est-ce que ça joue ou comment?"`,
  );

  const functionalized = functionalizeScript(value, RETURN_TYPES);
  const defunctionalized = defunctionalizeScript(functionalized);
  const transpiled = formatScriptToFunctionBody(
    transpile(defunctionalized),
    true,
  );

  return (
    <div className={cx(flex, expandBoth, flexColumn)}>
      <div className={cx(grow, flex, flexColumn)}>
        <h3>In editor script</h3>
        <WegasScriptEditor
          value={value}
          onChange={setValue}
          noGutter
          minimap={false}
          returnType={RETURN_TYPES}
          language="typescript"
          fileName="InEditorTestScript"
        />
      </div>
      <div className={cx(grow, flex, flexColumn)}>
        <h3>Initial script</h3>
        <WegasScriptEditor
          value={value}
          noGutter
          minimap={false}
          readOnly
          language="typescript"
          fileName="InitialTestScript"
        />
      </div>
      <div className={cx(grow, flex, flexColumn)}>
        <h3>Functionalized script</h3>
        <WegasScriptEditor
          value={functionalized}
          noGutter
          minimap={false}
          readOnly
          language="typescript"
          fileName="FunctionalizedTestScript"
        />
      </div>
      <div className={cx(grow, flex, flexColumn)}>
        <div className={cx(flex, flexRow)}>
          <h3 className={grow}>Defunctionalized script</h3>
          <div>
            <MessageString
              type={value === defunctionalized ? 'succes' : 'warning'}
              value={
                value === defunctionalized
                  ? 'Same as initial script'
                  : 'Different from initial script'
              }
            />
          </div>
        </div>
        <WegasScriptEditor
          value={defunctionalized}
          noGutter
          minimap={false}
          readOnly
          language="typescript"
          fileName="DefunctionalizedTestScript"
        />
      </div>
      <div className={cx(grow, flex, flexColumn)}>
        <h3>Transpiled script</h3>
        <WegasScriptEditor
          value={transpiled}
          noGutter
          minimap={false}
          readOnly
          language="javascript"
          fileName="transpiled"
        />
      </div>
    </div>
  );
}
