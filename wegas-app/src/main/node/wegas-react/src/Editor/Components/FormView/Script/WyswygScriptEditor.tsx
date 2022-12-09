import * as React from 'react';
import { wlog } from '../../../../Helper/wegaslog';
import { DragDropArray } from '../Array';
import { ExpressionEditor } from './Expressions/ExpressionEditor';
import { ExpressionEditorMk2 } from './Expressions/ExpressionEditorMk2';
import { isScriptCondition, ScriptView } from './Script';

function createNewExpression(mode?: ScriptMode): string {
  return isScriptCondition(mode) ? 'true' : ';';
}

interface WyswygScriptEditorProps extends ScriptView {
  expressions: string[];
  onChange: (script: string[]) => void;
  setError: (errors: string[] | undefined) => void;
}

export function WyswygScriptEditor({
  expressions,
  onChange,
  mode,
  setError,
}: WyswygScriptEditorProps) {
  // wlog(expressions);
  return (
    <DragDropArray
      array={expressions}
      onChildAdd={() => {
        expressions.push(createNewExpression(mode));
        onChange(expressions);
      }}
      onChildRemove={index => {
        expressions.splice(index, 1);
        onChange(expressions);
      }}
      onMove={(expressions: string[]) => onChange(expressions)}
    >
      {expressions?.map((expression, index) => (
        <ExpressionEditor
          key={index}
          code={expression}
          mode={mode}
          setError={setError}
          onChange={value => {
            expressions[index] = value;
            onChange(expressions);
          }}
        />
      ))}
    </DragDropArray>
  );
}
