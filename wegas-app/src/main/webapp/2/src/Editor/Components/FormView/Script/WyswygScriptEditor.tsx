import * as React from 'react';
import { ScriptView } from './Script';
import { Statement } from '@babel/types';
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
  return (
    <div className={scriptStyle} key={expressions ? expressions.length : -1}>
      <Form
        schema={{
          description: 'multipleStatementForm',
          properties: {
            statements: schemaProps.array(
              undefined,
              {
                statement: schemaProps.statement(undefined, true, mode),
              },
              //()=>expressions.push(),
              // onExpressionDelete,
            ),
          },
        }}
        value={{
          statements:
            expressions == null
              ? []
              : expressions.map(e => ({ statement: e ? e : emptyStatement() })),
        }}
        onChange={value =>
          onChange(
            value.statements.map((s: { statement: Statement }) =>
              s ? s.statement : emptyStatement(),
            ),
          )
        }
      />
    </div>
  );
}
