import * as React from 'react';
import { ScriptView } from './Script';
import { parse } from '@babel/parser';
import { wlog } from '../../../../Helper/wegaslog';
import { ExpressionEditor } from './ExpressionEditor';

interface WyswygScriptEditorProps extends ScriptView {
  script: string;
  onChange: (script: IScript) => void;
}

export function WyswygScriptEditor({
  script,
  onChange,
  mode,
  singleExpression,
  scriptableClassFilter,
}: WyswygScriptEditorProps) {
  const expressions = parse(script, { sourceType: 'script' }).program.body;
  if (singleExpression) {
    if (expressions.length > 1) {
      throw Error('Too much expressions for a single expression script');
    }
  }

  wlog(expressions);
  return (
    <div>
      {expressions.map((e, i) => (
        <ExpressionEditor
          key={i}
          expression={e}
          mode={mode}
          scriptableClassFilter={scriptableClassFilter}
        />
      ))}
    </div>
  );
}
