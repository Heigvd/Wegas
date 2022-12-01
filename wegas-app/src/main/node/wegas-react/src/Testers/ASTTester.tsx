import * as React from 'react';
import { cx } from '@emotion/css';
import { flex, expandBoth, flexColumn } from '../css/classes';
import { wlog } from '../Helper/wegaslog';
import {
  createBlock,
  createPrinter,
  createReturn,
  createSourceFile,
  EmitHint,
  isArrowFunction,
  isBlock,
  isExpressionStatement,
  isReturnStatement,
  isSourceFile,
  NewLineKind,
  ScriptTarget,
} from 'typescript';

const parsedFunction = `
()=>{
        var testus = "";
      testus = "yooo";
      "tadaaa" + testus;
}
`;
// `
//       var testus = "";
//       testus = "yooo";
//       "tadaaa" + testus;
// `;
// `
//     function test(salut:string):string{
//       var testus = "";
//       testus = "yooo";
//       return "tadaaa" + testus;
//       var test = 1;
//     }
//     `;
// `
// const test = (salut)=>"tadaa";
// `;
//   `
// Test.salut()
// `;

const wrappedExpressions = `
        var testus = "";
      testus = "yooo";
      "tadaaa" + testus;
`;

const printer = createPrinter({ newLine: NewLineKind.CarriageReturnLineFeed });

export default function ASTTester() {
  // STRIPPING
  let strippedCode = '';

  try {
    const sourceFile = createSourceFile(
      'Testedfile',
      parsedFunction,
      ScriptTarget.ESNext,
      /*setParentNodes */ true,
    );

    if (isSourceFile(sourceFile)) {
      const expressionStatement = sourceFile.statements[0];
      if (isExpressionStatement(expressionStatement)) {
        const arrowFunction = expressionStatement.expression;
        if (isArrowFunction(arrowFunction)) {
          const body = arrowFunction.body;
          if (body && isBlock(body)) {
            for (const statement of body.statements) {
              if (isReturnStatement(statement)) {
                const returnExpression = statement.expression;
                if (returnExpression != null) {
                  strippedCode +=
                    printer.printNode(
                      EmitHint.Unspecified,
                      returnExpression,
                      sourceFile,
                    ) + ';\n';
                }
              } else {
                strippedCode +=
                  printer.printNode(
                    EmitHint.Unspecified,
                    statement,
                    sourceFile,
                  ) + '\n';
              }
            }
          }
        }
      } else {
        wlog(sourceFile);
      }
    }
  } catch (e) {
    wlog(e);
    strippedCode = JSON.stringify(e);
  }

  wlog(strippedCode);

  // WRAPPING
  let wrappedCode = '';

  try {
    const sourceFile = createSourceFile(
      'Testedfile',
      wrappedExpressions,
      ScriptTarget.ESNext,
      /*setParentNodes */ true,
    );

    if (isSourceFile(sourceFile)) {
      const valStatements = sourceFile.statements.slice(0, -1);
      const lastStatement = sourceFile.statements.slice(-1)[0];
      if (isExpressionStatement(lastStatement)) {
        valStatements.push(createReturn(lastStatement.expression));
      } else {
        valStatements.push(lastStatement);
      }

      const block = createBlock(valStatements);

      wrappedCode = `(test:string):string=>${printer.printNode(
        EmitHint.Unspecified,
        block,
        sourceFile,
      )}`;
    }
  } catch (e) {
    wlog(e);
    wrappedCode = JSON.stringify(e);
  }
  wlog(wrappedCode);

  return (
    <div className={cx(flex, expandBoth, flexColumn)}>
      <div>{strippedCode}</div>
      <div>{wrappedCode}</div>
    </div>
  );
}
