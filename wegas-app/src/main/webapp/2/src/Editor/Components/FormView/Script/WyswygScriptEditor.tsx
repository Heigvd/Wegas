import * as React from 'react';
import { ScriptView } from './Script';
import { ExpressionEditor } from './ExpressionEditor';
import { Statement } from '@babel/types';
import { css } from 'emotion';
import { IconButton } from '../../../../Components/Inputs/Button/IconButton';
import { emptyStatement } from '@babel/types';

const scriptStyle = css({
  borderWidth: '1px',
  padding: '2px',
  borderStyle: 'solid',
  // borderColor: themeVar.primaryLighterColor,
});

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
  // const [currentExpressions, setCurrentExpressions] = React.useState(
  //   expressions,
  // );

  // React.useEffect(() => {
  //   setCurrentExpressions(expressions);
  // }, [expressions]);

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

  const onExpressionDelete = React.useCallback(
    (index: number) => {
      if (expressions != null) {
        const newExpressions = [...expressions];
        newExpressions.splice(index, 1);
        onChange(newExpressions);
      }
    },
    [expressions, onChange],
  );

  const onExpressionAdd = React.useCallback(
    (index: number) => {
      if (expressions != null) {
        const newExpressions = [...expressions];
        newExpressions.splice(index, 0, emptyStatement());
        onChange(newExpressions);
      } else {
        onChange([emptyStatement()]);
      }
    },
    [expressions, onChange],
  );

  return (
    <div className={scriptStyle} key={expressions ? expressions.length : -1}>
      <IconButton icon="plus" onClick={() => onExpressionAdd(0)} />
      {expressions != null &&
        expressions.map((e, i) => (
          <>
            <ExpressionEditor
              key={'Editor' + i}
              statement={e}
              mode={mode}
              scriptableClassFilter={scriptableClassFilter}
              onChange={statement => onExpressionChange(statement, i)}
              onDelete={() => onExpressionDelete(i)}
            />
            <IconButton
              key={'Button' + i}
              icon="plus"
              onClick={() => onExpressionAdd(i + 1)}
            />
          </>
        ))}
    </div>
  );
}
