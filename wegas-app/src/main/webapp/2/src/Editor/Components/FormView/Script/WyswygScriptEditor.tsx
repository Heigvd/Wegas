import * as React from 'react';
import { ScriptView } from './Script';
import { ExpressionEditor } from './ExpressionEditor';
import { Statement } from '@babel/types';

interface WyswygScriptEditorProps extends ScriptView {
  expressions: Statement[] | null;
  onChange: (script: Statement[]) => void;
}

export function WyswygScriptEditor({
  expressions,
  onChange,
  mode,
  scriptableClassFilter,
}: WyswygScriptEditorProps) {
  const onExpressionChange = React.useCallback(
    (expression: Statement | Statement[], index?: number) => {
      if (index !== undefined && expressions) {
        const newExpressions = [...expressions];
        newExpressions.splice(
          index,
          1,
          ...(Array.isArray(expression) ? expression : [expression]),
        );
        onChange(newExpressions);
      } else {
        onChange(Array.isArray(expression) ? expression : [expression]);
      }
    },
    [expressions, onChange],
  );

  return (
    <div>
      {expressions == null ? (
        <ExpressionEditor
          statement={null}
          mode={mode}
          scriptableClassFilter={scriptableClassFilter}
          onChange={onExpressionChange}
        />
      ) : (
        expressions.map((e, i) => (
          <ExpressionEditor
            key={i}
            statement={e}
            mode={mode}
            scriptableClassFilter={scriptableClassFilter}
            onChange={statement => onExpressionChange(statement, i)}
          />
        ))
      )}
    </div>
  );
}
