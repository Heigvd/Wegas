import { Statement, isExpressionStatement } from '@babel/types';
import generate from '@babel/generator';
import * as React from 'react';
import { ExprStatement } from './ExpressionStatement';

interface StatementsProps {
  statements: Statement[];
  onChange: (statements: Statement[]) => void;
  mode: 'SET' | 'GET';
}
export function Statements({ statements, onChange, mode }: StatementsProps) {
  return (
    <>
      {statements.map(
        (s, i) =>
          isExpressionStatement(s) ? (
            <ExprStatement
              stmt={s}
              key={i}
              mode={mode}
              onChange={stmt => {
                const copy = statements.slice();
                copy.splice(i, 1, stmt);
                onChange(copy);
              }}
            />
          ) : (
            <div key={i}>
              {generate(s).code}
              {/* <SrcEditor
                language="javascript"
                value={generate(s).code}
                onBlur={code => {
                  const stmts = parse(code, { sourceType: 'script' }).program
                    .body;
                  const copy = statements.slice();
                  copy.splice(i, 1, ...stmts);
                  onChange(copy);
                }}
              /> */}
            </div>
          ),
      )}
    </>
  );
}
