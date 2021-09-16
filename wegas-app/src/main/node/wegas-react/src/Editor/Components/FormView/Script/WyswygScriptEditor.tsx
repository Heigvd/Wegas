import * as React from 'react';
import { ScriptView, isScriptCondition } from './Script';
import { Statement, expressionStatement, booleanLiteral } from '@babel/types';
import { emptyStatement } from '@babel/types';
import Form from 'jsoninput';
import { schemaProps } from '../../../../Components/PageComponents/tools/schemaProps';
import generate from '@babel/generator';
import { parse } from '@babel/parser';

function createNewExpression(mode?: ScriptMode) {
  return isScriptCondition(mode)
    ? expressionStatement(booleanLiteral(true))
    : emptyStatement();
}

function forceEmptyExpressions(
  expressions: Statement[] | null,
  mode?: ScriptMode,
): Statement[] {
  return expressions == null || expressions.length === 0
    ? [createNewExpression(mode)]
    : expressions;
}

interface WyswygScriptEditorProps extends ScriptView {
  expressions: Statement[] | null;
  onChange: (script: Statement[]) => void;
  controls?: React.ReactNode;
}

export function WyswygScriptEditor({
  expressions,
  onChange,
  mode,
  controls,
}: WyswygScriptEditorProps) {
  // These state and effect are here just to avoid loosing focus when changes occures
  const [expr, setExpr] = React.useState(expressions);
  React.useEffect(() => {
    setExpr(expressions);
  }, [expressions]);

  return (
    <>
      <Form
        schema={{
          description: 'multipleStatementForm',
          view: { noMarginTop: true },
          properties: {
            statements: schemaProps.array({
              controls,
              itemSchema: {
                statement: schemaProps.statement({
                  required: true,
                  mode,
                  noMarginTop: true,
                }),
              },
              userOnChildAdd: () => ({
                statement: mode === 'GET' ? 'true' : ';',
              }),
            }),
          },
        }}
        value={{
          statements: forceEmptyExpressions(expr, mode).map(e => ({
            statement: generate(e ? e : createNewExpression(mode)).code,
          })),
        }}
        onChange={value => {
          const cleanValue: Statement[] = value.statements.map(
            (s: { statement: string }) => {
              return s
                ? parse(s.statement).program.body[0]
                : createNewExpression(mode);
            },
          );
          setExpr(forceEmptyExpressions(cleanValue, mode));
          onChange(cleanValue);
        }}
      />
    </>
  );
}
