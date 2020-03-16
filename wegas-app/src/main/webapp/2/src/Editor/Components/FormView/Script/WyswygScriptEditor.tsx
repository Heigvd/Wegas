import * as React from 'react';
import { ScriptView, isScriptCondition } from './Script';
import { Statement, expressionStatement, booleanLiteral } from '@babel/types';
import { css } from 'emotion';
import { emptyStatement } from '@babel/types';
import Form from 'jsoninput';
import { schemaProps } from '../../../../Components/PageComponents/tools/schemaProps';

const scriptStyle = css({
  borderWidth: '1px',
  padding: '2px',
  borderStyle: 'solid',
});

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
            statements: schemaProps.array(
              undefined,
              {
                statement: schemaProps.statement(undefined, true, mode),
              },
              () =>
                onChange([
                  ...(expr == null ? [] : expr),
                  isScriptCondition(mode)
                    ? expressionStatement(booleanLiteral(true))
                    : emptyStatement(),
                ]),
            ),
          },
        }}
        value={{
          statements:
            expr == null
              ? []
              : expr.map(e => ({ statement: e ? e : emptyStatement() })),
        }}
        onChange={value => {
          const cleanValue: Statement[] = value.statements.map(
            (s: { statement: Statement }) =>
              s
                ? s.statement
                : isScriptCondition(mode)
                ? expressionStatement(booleanLiteral(true))
                : emptyStatement(),
          );
          setExpr(cleanValue);
          onChange(cleanValue);
        }}
      />
    </div>
  );
}
