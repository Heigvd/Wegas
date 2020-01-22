import * as React from 'react';
import { WidgetProps } from 'jsoninput/typings/types';
import { LabeledView, Labeled } from '../labeled';
import { CommonView, CommonViewContainer } from '../commonView';
import { IconButton } from '../../../../Components/Inputs/Button/IconButton';
import { WegasScriptEditor } from '../../ScriptEditors/WegasScriptEditor';
import { css } from 'emotion';
import { store } from '../../../../data/store';
import { runScript } from '../../../../data/Reducer/VariableInstanceReducer';
import { Player } from '../../../../data/selectors';
import { WyswygScriptEditor } from './WyswygScriptEditor';
import { Statement, program, BinaryExpression } from '@babel/types';
import { parse } from '@babel/parser';
import generate from '@babel/generator';
import { debounceAction } from '../../../../Helper/debounceAction';
import { Expression } from '@babel/types';
import { isExpressionStatement } from '@babel/types';
import { isLogicalExpression } from '@babel/types';
import { expressionStatement } from '@babel/types';
import { LogicalExpression } from '@babel/types';
import { logicalExpression } from '@babel/types';
import { isBinaryExpression } from '@babel/types';

export const scriptEditStyle = css({
  height: '5em',
  marginTop: '0.8em',
  width: '500px',
});

export type ScriptMode = 'SET' | 'GET';

export type CodeLanguage =
  | 'JavaScript'
  | 'TypeScript'
  | 'CSS'
  | 'JSON'
  | 'PlainText';

export function scriptIsCondition(
  mode?: ScriptMode,
  scriptableClassFilter?: WegasScriptEditorReturnTypeName[],
) {
  return (
    mode === 'GET' &&
    (scriptableClassFilter === undefined ||
      scriptableClassFilter.includes('boolean'))
  );
}

export function returnTypes(
  mode?: ScriptMode,
  scriptableClassFilter?: WegasScriptEditorReturnTypeName[],
): WegasScriptEditorReturnTypeName[] | undefined {
  return mode === 'GET'
    ? ['boolean']
    : mode === 'SET' && mode === undefined
    ? ['void']
    : scriptableClassFilter;
}

function conditionVisitor(
  expression: Expression,
  prevStatement: Statement[] = [],
): Statement[] {
  if (isLogicalExpression(expression) && expression.operator === '&&') {
    return conditionVisitor(expression.left, [
      ...prevStatement,
      expressionStatement(expression.right),
    ]);
  } else {
    return [...prevStatement, expressionStatement(expression)];
  }
}

function concatBinaryExpressionsToLogicalExpression(
  binaryExpressions: BinaryExpression[],
  index: number = 0,
): LogicalExpression {
  if (index === binaryExpressions.length - 2) {
    return logicalExpression(
      '&&',
      binaryExpressions[index + 1],
      binaryExpressions[index],
    );
  } else {
    return logicalExpression(
      '&&',
      concatBinaryExpressionsToLogicalExpression(binaryExpressions, index + 1),
      binaryExpressions[index],
    );
  }
}

function concatStatementsToCondition(statements: Statement[]): Statement[] {
  const binaryExpressions: BinaryExpression[] = [];
  let canBeMerged = true;
  statements.forEach(s => {
    if (isExpressionStatement(s) && isBinaryExpression(s.expression)) {
      binaryExpressions.push(s.expression);
    } else {
      canBeMerged = false;
    }
  });

  if (canBeMerged && binaryExpressions.length > 1) {
    const test = concatBinaryExpressionsToLogicalExpression(binaryExpressions);
    //debugger;
    return [expressionStatement(test)];
  } else {
    throw Error("Condition's expressions cannot be merged");
  }
}

export interface ScriptView {
  mode?: ScriptMode;
  scriptableClassFilter?: WegasScriptEditorReturnTypeName[];
}

interface ScriptProps
  extends WidgetProps.BaseProps<LabeledView & CommonView & ScriptView> {
  value?: string | IScript;
  context?: IVariableDescriptor<IVariableInstance>;
  onChange: (code: IScript) => void;
}

export function Script({
  view,
  errorMessage,
  value,
  context,
  onChange,
}: ScriptProps) {
  const [error, setError] = React.useState(errorMessage);
  const [srcMode, setSrcMode] = React.useState(false);
  const [scriptContent, setScriptContent] = React.useState('');
  const [expressions, setExpressions] = React.useState<Statement[] | null>(
    null,
  );

  const isServerScript = view.mode === 'SET';

  const testScript = React.useCallback(() => {
    try {
      store.dispatch(runScript(scriptContent, Player.selectCurrent(), context));
      setError(undefined);
    } catch (error) {
      setError([error.message]);
    }
  }, [context, scriptContent]);

  const onCodeChange = React.useCallback(
    (value: string) => {
      debounceAction('ScriptEditorOnChange', () => {
        onChange({
          '@class': 'Script',
          language: 'JavaScript',
          content: value,
        });
        setScriptContent(() => {
          return value;
        });
      });
    },
    [onChange],
  );

  React.useEffect(() => {
    setError(errorMessage);
  }, [errorMessage]);

  React.useEffect(() => {
    if (error !== undefined && error.length > 0) {
      setSrcMode(true);
    }
  }, [error]);

  React.useEffect(() => {
    setScriptContent(
      value == null ? '' : typeof value === 'string' ? value : value.content,
    );
  }, [value]);

  React.useEffect(() => {
    try {
      if (scriptContent === '') {
        setExpressions(null);
      } else {
        let newExpressions = parse(scriptContent, { sourceType: 'script' })
          .program.body;

        if (
          scriptIsCondition(view.mode, view.scriptableClassFilter) &&
          newExpressions.length === 1
        ) {
          const condition = newExpressions[0];
          if (isExpressionStatement(condition)) {
            newExpressions = conditionVisitor(condition.expression);
          } else {
            setError(['The script cannot be parsed as a condition']);
          }
        } else {
          setError(['The script cannot be parsed as a condition']);
        }
        setExpressions(newExpressions);
      }
      setError(undefined);
    } catch (e) {
      setError([e.message]);
    }
  }, [scriptContent, view.mode, view.scriptableClassFilter]);

  return (
    <CommonViewContainer view={view} errorMessage={error}>
      <Labeled label={view.label} description={view.description} /*{...view}*/>
        {({ labelNode }) => {
          return (
            <>
              {labelNode}
              {!error && (
                <IconButton
                  icon="code"
                  pressed={error !== undefined}
                  onClick={() => setSrcMode(sm => !sm)}
                />
              )}
              {isServerScript && (
                <IconButton icon="play" onClick={testScript} />
              )}
              {srcMode ? (
                <div className={scriptEditStyle}>
                  <WegasScriptEditor
                    value={scriptContent}
                    onBlur={onCodeChange}
                    onChange={onCodeChange}
                    minimap={false}
                    noGutter={true}
                    returnType={view.scriptableClassFilter}
                  />
                </div>
              ) : (
                <WyswygScriptEditor
                  expressions={expressions}
                  onChange={e => {
                    let returnedProgram = program(
                      expressions ? expressions : [],
                    );
                    if (
                      scriptIsCondition(view.mode, view.scriptableClassFilter)
                    ) {
                      try {
                        returnedProgram = program(
                          concatStatementsToCondition(e),
                        );
                      } catch (e) {
                        setError([e.message]);
                      }
                    } else {
                      returnedProgram = program(e);
                    }
                    onCodeChange(generate(returnedProgram).code);
                  }}
                  mode={view.mode}
                  scriptableClassFilter={returnTypes(
                    view.mode,
                    view.scriptableClassFilter,
                  )}
                />
              )}
            </>
          );
        }}
      </Labeled>
    </CommonViewContainer>
  );
}
