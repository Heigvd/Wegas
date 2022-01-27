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
import { expandBoth, flex, flexColumn, grow } from '../css/classes';
import {
  footer,
  formatScriptToFunctionBody,
  header,
  WegasScriptEditor,
} from '../Editor/Components/ScriptEditors/WegasScriptEditor';

function functionalizeScript(
  nakedScript: string,
  returnType?: WegasScriptEditorReturnTypeName[],
  args?: [string, WegasScriptEditorReturnTypeName[]][],
) {
  const declarations: string[] = [];
  const content: string[] = [];

  const sourceFile = createSourceFile(
    'Testedfile',
    nakedScript,
    ScriptTarget.ESNext,
    true,
  );

  if (isSourceFile(sourceFile)) {
    sourceFile.statements.forEach(statement =>
      (isImportDeclaration(statement) ? declarations : content).push(
        statement.getText(),
      ),
    );

    if (returnType !== undefined && returnType.length > 0) {
      const newValue = formatScriptToFunctionBody(content.join('\n'));
      return `${declarations.join('\n')}\n${header(
        returnType,
        args,
      )}${newValue}${footer()}`;
    } else {
      return [...declarations, ...content].join('\n');
    }
  } else {
    return nakedScript;
  }
}

function defunctionalizeScript(functionalizedScript: string): string {
  const declarations: string[] = [];
  let virtualFunction: string | undefined;

  const sourceFile = createSourceFile(
    'Testedfile',
    functionalizedScript,
    ScriptTarget.ESNext,
    true,
  );

  if (isSourceFile(sourceFile)) {
    sourceFile.statements.forEach(statement => {
      if (isImportDeclaration(statement)) {
        declarations.push(statement.getText());
      } else if (
        isExpressionStatement(statement) &&
        isArrowFunction(statement.expression) &&
        isBlock(statement.expression.body)
      ) {
        virtualFunction = statement.expression.body.statements
          .map(statement => {
            if (isReturnStatement(statement)) {
              return statement.expression?.getText();
            } else {
              return statement.getText();
            }
          })
          .join('\n');
      }
    });
    if (virtualFunction != null) {
      return [...declarations, virtualFunction].join('\n');
    } else {
      return functionalizedScript;
    }
  } else {
    return functionalizedScript;
  }
}

const RETURN_TYPES: WegasScriptEditorReturnTypeName[] = ['string'];

export default function ScriptParserTester() {
  const [value, setValue] = React.useState(
    `import {test} from "./test";\n"Est-ce que ça joue?"\nfunction test(){return "salut!";}\nimport {moche} from "./moche";\n"Est-ce que ça joue ou comment?"`,
  );

  const functionalized = functionalizeScript(value, RETURN_TYPES);
  const defunctionalized = defunctionalizeScript(functionalized);
  const transpiled = formatScriptToFunctionBody(transpile(defunctionalized), true);

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
        <h3>Defunctionalized script</h3>
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
