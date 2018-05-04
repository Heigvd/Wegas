import { Statement, isExpressionStatement } from '@babel/types';
import generate from 'babel-generator';
import * as React from 'react';
import { Impact } from './Impact';

interface StatementsProps {
  statements: Statement[];
  onChange: (statements: Statement[]) => void;
}
export function Statements({ statements, onChange }: StatementsProps) {
  return (
    <>
      {statements.map(
        (s, i) =>
          isExpressionStatement(s) ? (
            <Impact
              stmt={s}
              onChange={stmt => {
                const copy = statements.slice();
                copy.splice(i, 1, stmt);
                onChange(copy);
              }}
            />
          ) : (
            <div>
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
