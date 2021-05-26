import * as React from 'react';
import { ScriptView, isScriptCondition } from './Script';
import { Statement, expressionStatement, booleanLiteral } from '@babel/types';
import { css } from 'emotion';
import { emptyStatement } from '@babel/types';
import Form from 'jsoninput';
import { schemaProps } from '../../../../Components/PageComponents/tools/schemaProps';
import { themeVar } from '../../../../Components/Theme/ThemeVars';

const scriptStyle = css({
  border: '1px solid ' + themeVar.Common.colors.DisabledColor,
  padding: '2px',
});

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
}

export function WyswygScriptEditor({
  expressions,
  onChange,
  mode,
}: WyswygScriptEditorProps) {
  // These state and effect are here just to avoid loosing focus when changes occures
  const [expr, setExpr] = React.useState(expressions);
  React.useEffect(() => {
    setExpr(expressions);
  }, [expressions]);

  return (
    <div className={scriptStyle}>
      <Form
        schema={{
          description: 'multipleStatementForm',
          properties: {
            statements: schemaProps.array({
              itemSchema: {
                statement: schemaProps.statement({ required: true, mode }),
              },
              userOnChildAdd: () => ({ statement: createNewExpression(mode) }),
            }),
          },
        }}
        value={{
          statements: forceEmptyExpressions(expr, mode).map(e => ({
            statement: e ? e : createNewExpression(mode),
          })),
        }}
        onChange={value => {
          const cleanValue: Statement[] = value.statements.map(
            (s: { statement: Statement }) =>
              s ? s.statement : createNewExpression(mode),
          );
          setExpr(forceEmptyExpressions(cleanValue, mode));
          onChange(cleanValue);
        }}
      />
    </div>
  );
  // }
}
