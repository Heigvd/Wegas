import {
  Statement,
  isExpressionStatement,
  emptyStatement,
  isEmptyStatement,
  isCallExpression,
} from '@babel/types';
import generate from '@babel/generator';
import * as React from 'react';
import { SecureExpressionStatement } from './ExpressionStatement';
import { IconButton } from '../../../../Components/Inputs/Button/IconButton';
import { css } from 'emotion';
import { isBinaryExpression } from '@babel/types';
import { ScriptMode } from '.';

interface StatementsProps {
  statements: Statement[];
  onChange: (statements: Statement[]) => void;
  mode: ScriptMode;
  single?: boolean;
  scriptableClassFilter?: WegasScriptEditorReturnTypeName[];
}
const contentStyle = css({
  display: 'flex',
  alignItems: 'flex-start',
});
const flexGrow = css({
  flexGrow: 1,
});
const codeStyle = css({
  display: 'inline-block',
  margin: '0.4em 0',
  whiteSpace: 'pre',
});
export function Statements({
  statements,
  onChange,
  mode,
  single,
  scriptableClassFilter,
}: StatementsProps) {
  return (
    <>
      {statements.map((s, i) => (
        <div key={i} className={contentStyle}>
          <div className={flexGrow}>
            {(isExpressionStatement(s) &&
              (isCallExpression(s.expression) ||
                isBinaryExpression(s.expression))) ||
            isEmptyStatement(s) ? (
              <SecureExpressionStatement
                stmt={s}
                mode={mode}
                onChange={stmt => {
                  const copy = statements.slice();
                  copy.splice(i, 1, stmt);
                  onChange(copy);
                }}
                scriptableClassFilter={scriptableClassFilter}
              />
            ) : (
              <code className={codeStyle}>{generate(s).code}</code>
            )}
          </div>
          {!single && (
            <IconButton
              icon="trash"
              onClick={() => {
                const copy = statements.slice();
                copy.splice(i, 1);
                onChange(copy);
              }}
            />
          )}
        </div>
      ))}
      {!single && (
        <IconButton
          icon="plus"
          onClick={() => onChange(statements.concat(emptyStatement()))}
        />
      )}
    </>
  );
}
