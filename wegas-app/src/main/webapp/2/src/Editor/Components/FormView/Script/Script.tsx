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
import {
  Statement,
  program,
  BinaryExpression,
  isBooleanLiteral,
  BooleanLiteral,
} from '@babel/types';
import { parse } from '@babel/parser';
import generate from '@babel/generator';
import { Expression } from '@babel/types';
import { isExpressionStatement } from '@babel/types';
import { isLogicalExpression } from '@babel/types';
import { expressionStatement } from '@babel/types';
import { LogicalExpression } from '@babel/types';
import { logicalExpression } from '@babel/types';
import { isBinaryExpression } from '@babel/types';
import { Menu } from '../../../../Components/Menu';

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

const operators = ['&&', '||'] as const;

type Operator = typeof operators[number];

export function isScriptCondition(mode?: ScriptMode) {
  return mode === 'GET';
}

export function returnTypes(
  mode?: ScriptMode,
): WegasScriptEditorReturnTypeName[] | undefined {
  return isScriptCondition(mode) ? ['boolean'] : undefined;
}

function conditionGenerator(
  operator: Operator,
  expression: Expression,
  prevStatement: Statement[] = [],
): Statement[] {
  if (isLogicalExpression(expression) && expression.operator === operator) {
    return conditionGenerator(operator, expression.left, [
      expressionStatement(expression.right),
      ...prevStatement,
    ]);
  } else {
    return [expressionStatement(expression), ...prevStatement];
  }
}

function concatBinaryExpressionsToLogicalExpression(
  operator: Operator,
  binaryExpressions: (BinaryExpression | BooleanLiteral)[],
  index: number = 0,
): LogicalExpression {
  if (index === binaryExpressions.length - 2) {
    return logicalExpression(
      operator,
      binaryExpressions[index],
      binaryExpressions[index + 1],
    );
  } else {
    return logicalExpression(
      operator,
      binaryExpressions[index],
      concatBinaryExpressionsToLogicalExpression(
        operator,
        binaryExpressions,
        index + 1,
      ),
    );
  }
}

function concatStatementsToCondition(
  operator: Operator,
  statements: Statement[],
): Statement[] {
  const binaryExpressions: (BinaryExpression | BooleanLiteral)[] = [];
  let canBeMerged = true;
  statements.forEach(s => {
    if (
      isExpressionStatement(s) &&
      (isBinaryExpression(s.expression) || isBooleanLiteral(s.expression))
    ) {
      binaryExpressions.push(s.expression);
    } else {
      canBeMerged = false;
    }
  });

  //binaryExpressions.reverse();

  if (canBeMerged && binaryExpressions.length > 1) {
    const binaryCondition = concatBinaryExpressionsToLogicalExpression(
      operator,
      binaryExpressions,
    );
    return [expressionStatement(binaryCondition)];
  } else {
    throw Error("Condition's expressions cannot be merged");
  }
}

export interface ScriptView {
  mode?: ScriptMode;
}

export interface ScriptProps
  extends WidgetProps.BaseProps<LabeledView & CommonView & ScriptView> {
  value?: string | IScript | undefined;
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
  const [statements, setStatements] = React.useState<Statement[] | null>(null);
  const [operator, setOperator] = React.useState<Operator>(operators[0]);

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
      setScriptContent(value);
      onChange({
        '@class': 'Script',
        language: 'JavaScript',
        content: value,
      });
    },
    [onChange],
  );

  const onStatementsChange = React.useCallback(
    (statements: Statement[], operator: Operator) => {
      let returnedProgram = program(statements ? statements : []);
      if (isScriptCondition(view.mode)) {
        try {
          returnedProgram = program(
            concatStatementsToCondition(operator, statements),
          );
        } catch (e) {
          setError([e.message]);
        }
      } else {
        returnedProgram = program(statements);
      }
      onCodeChange(generate(returnedProgram).code);
    },
    [onCodeChange, view.mode],
  );

  const onSelectOperator = React.useCallback(
    (operator: Operator) => {
      setOperator(operator);
      if (!error && !srcMode) {
        // TODO : Something could be done when in src mode
        if (statements !== null) {
          onStatementsChange(statements, operator);
        }
      }
    },
    [error, onStatementsChange, srcMode, statements],
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
        setStatements(null);
      } else {
        let newExpressions = parse(scriptContent, { sourceType: 'script' })
          .program.body;

        if (isScriptCondition(view.mode) && newExpressions.length === 1) {
          const condition = newExpressions[0];
          if (isExpressionStatement(condition)) {
            newExpressions = conditionGenerator(operator, condition.expression);
          } else {
            setError(['The script cannot be parsed']);
          }
        } else {
          setError(['The script cannot be parsed as a condition']);
        }
        setStatements(newExpressions);
      }
      setError(undefined);
    } catch (e) {
      setError([e.message]);
    }
  }, [operator, scriptContent, view.mode]);

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
              {isScriptCondition(view.mode) && (
                <Menu
                  label={operator}
                  items={operators.map(o => ({ label: o }))}
                  onSelect={({ label }) => onSelectOperator(label)}
                />
              )}
              {srcMode ? (
                <div className={scriptEditStyle}>
                  <WegasScriptEditor
                    value={scriptContent}
                    onChange={onCodeChange}
                    minimap={false}
                    noGutter={true}
                    returnType={returnTypes(view.mode)}
                  />
                </div>
              ) : (
                <WyswygScriptEditor
                  expressions={statements}
                  onChange={e => {
                    onStatementsChange(e, operator);
                    // let returnedProgram = program(
                    //   expressions ? expressions : [],
                    // );
                    // if (isScriptCondition(view.mode)) {
                    //   try {
                    //     returnedProgram = program(
                    //       concatStatementsToCondition(operator, e),
                    //     );
                    //   } catch (e) {
                    //     setError([e.message]);
                    //   }
                    // } else {
                    //   returnedProgram = program(e);
                    // }
                    // onCodeChange(generate(returnedProgram).code);
                  }}
                  mode={view.mode}
                />
              )}
            </>
          );
        }}
      </Labeled>
    </CommonViewContainer>
  );
}
