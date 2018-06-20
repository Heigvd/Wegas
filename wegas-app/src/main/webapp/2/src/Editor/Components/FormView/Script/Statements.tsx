import {
  Statement,
  isExpressionStatement,
  emptyStatement,
  isEmptyStatement,
} from '@babel/types';
import generate from '@babel/generator';
import * as React from 'react';
import { ExprStatement } from './ExpressionStatement';
import { IconButton } from '../../../../Components/Button/IconButton';
import { css } from 'emotion';

interface StatementsProps {
  statements: Statement[];
  onChange: (statements: Statement[]) => void;
  mode: 'SET' | 'GET';
}
const contentStyle = css({
  display: 'flex',
  alignItems: 'flex-start',
});
const flexGrow = css({
  flexGrow: 1,
});
export function Statements({ statements, onChange, mode }: StatementsProps) {
  return (
    <>
      {statements.map((s, i) => (
        <div key={i} className={contentStyle}>
          <div className={flexGrow}>
            {isExpressionStatement(s) || isEmptyStatement(s) ? (
              <ExprStatement
                stmt={s}
                mode={mode}
                onChange={stmt => {
                  const copy = statements.slice();
                  copy.splice(i, 1, stmt);
                  onChange(copy);
                }}
              />
            ) : (
              <code>{generate(s).code}</code>
            )}
          </div>
          <IconButton
            icon="trash"
            onClick={() => {
              const copy = statements.slice();
              copy.splice(i, 1);
              onChange(copy);
            }}
          />
        </div>
      ))}
      <IconButton
        icon="plus"
        onClick={() => onChange(statements.concat(emptyStatement()))}
      />
    </>
  );
}
