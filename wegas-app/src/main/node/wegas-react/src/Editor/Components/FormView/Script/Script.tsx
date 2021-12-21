import generate from '@babel/generator';
import { parse } from '@babel/parser';
import {
  BinaryExpression,
  BooleanLiteral,
  CallExpression,
  Expression,
  expressionStatement,
  isBinaryExpression,
  isBooleanLiteral,
  isCallExpression,
  isEmptyStatement,
  isExpressionStatement,
  isLogicalExpression,
  LogicalExpression,
  logicalExpression,
  program,
  Statement,
} from '@babel/types';
import { css, cx } from '@emotion/css';
import { WidgetProps } from 'jsoninput/typings/types';
import * as React from 'react';
import { IScript, IVariableDescriptor, IVariableInstance } from 'wegas-ts-api';
import { DropMenu } from '../../../../Components/DropMenu';
import { IconButton } from '../../../../Components/Inputs/Buttons/IconButton';
import { themeVar } from '../../../../Components/Theme/ThemeVars';
import {
  flex,
  grow,
  justifyEnd,
  secondaryButtonStyle,
} from '../../../../css/classes';
import { runScript } from '../../../../data/Reducer/VariableInstanceReducer';
import { Player } from '../../../../data/selectors';
import { store } from '../../../../data/Stores/store';
import { createScript } from '../../../../Helper/wegasEntites';
import { editorTabsTranslations } from '../../../../i18n/editorTabs/editorTabs';
import { useInternalTranslate } from '../../../../i18n/internalTranslator';
import { ResizeHandle } from '../../ResizeHandle';
import { EmbeddedSrcEditor } from '../../ScriptEditors/EmbeddedSrcEditor';
import { WegasScriptEditor } from '../../ScriptEditors/WegasScriptEditor';
import { CommonView, CommonViewContainer } from '../commonView';
import { Labeled, LabeledView } from '../labeled';
import { WyswygScriptEditor } from './WyswygScriptEditor';

export const scriptEditStyle = css({
  minHeight: '5em',
  width: '500px',
});

const operators = ['&&', '||'] as const;

type Operator = typeof operators[number];

export function isScriptCondition(mode?: ScriptMode) {
  return mode === 'GET' || mode === 'GET_CLIENT';
}

export function returnTypes(
  mode?: ScriptMode,
): WegasScriptEditorReturnTypeName[] | undefined {
  return mode === 'GET_CLIENT' ? ['boolean'] : undefined;
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
  binaryExpressions: (BinaryExpression | BooleanLiteral | CallExpression)[],
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
  const binaryExpressions: (
    | BinaryExpression
    | BooleanLiteral
    | CallExpression
  )[] = [];
  let canBeMerged = true;
  statements.forEach(s => {
    if (
      isExpressionStatement(s) &&
      (isBinaryExpression(s.expression) ||
        isBooleanLiteral(s.expression) ||
        isCallExpression(s.expression))
    ) {
      binaryExpressions.push(s.expression);
    } else {
      canBeMerged = isEmptyStatement(s);
    }
  });

  if (canBeMerged) {
    if (binaryExpressions.length === 1) {
      return [expressionStatement(binaryExpressions[0])];
    } else {
      const binaryCondition = concatBinaryExpressionsToLogicalExpression(
        operator,
        binaryExpressions,
      );
      return [expressionStatement(binaryCondition)];
    }
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
  const script = React.useRef('');
  const [statements, setStatements] = React.useState<Statement[] | null>(null);
  const [operator, setOperator] = React.useState<Operator>(operators[0]);
  const i18nValues = useInternalTranslate(editorTabsTranslations);

  const isServerScript = view.mode === 'SET' || view.mode === 'GET';

  const testScript = React.useCallback(
    value => {
      try {
        store.dispatch(runScript(value, Player.selectCurrent(), context));
        setError(undefined);
      } catch (error) {
        setError([error.message]);
      }
    },
    [context],
  );

  const onCodeChange = React.useCallback(
    (value: string) => {
      if (value !== script.current) {
        script.current = value;
        onChange(createScript(value));
      }
    },
    [onChange],
  );

  const onStatementsChange = React.useCallback(
    (statements: Statement[], operator: Operator) => {
      let returnedProgram = program(statements ? statements : []);
      if (statements.length > 0 && isScriptCondition(view.mode)) {
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
      setStatements(statements);
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
    const newValue =
      value == null ? '' : typeof value === 'string' ? value : value.content;
    if (script.current !== newValue) {
      script.current = newValue;
    }
  }, [value]);

  React.useEffect(() => {
    try {
      const newValue =
        value == null ? '' : typeof value === 'string' ? value : value.content;
      if (newValue === '') {
        setStatements(null);
      } else {
        let newExpressions = parse(newValue, { sourceType: 'script' }).program
          .body;

        if (isScriptCondition(view.mode)) {
          if (newExpressions.length === 1) {
            const condition = newExpressions[0];
            if (isExpressionStatement(condition)) {
              newExpressions = conditionGenerator(
                operator,
                condition.expression,
              );
            } else {
              setError([i18nValues.scripts.canntoBeParsed]);
            }
          } else {
            setError([i18nValues.scripts.canntoBeParsedCondition]);
          }
        }
        setStatements(newExpressions);
      }
      setError(undefined);
    } catch (e) {
      setError([e.message]);
    }
  }, [
    i18nValues.scripts.canntoBeParsed,
    i18nValues.scripts.canntoBeParsedCondition,
    operator,
    value,
    view.mode,
  ]);

  return (
    <CommonViewContainer view={view} errorMessage={error}>
      <Labeled label={view.label} description={view.description}>
        {({ labelNode }) => {
          return (
            <>
              {labelNode}
              <div
                className={css({
                  border: '1px solid ' + themeVar.colors.DisabledColor,
                  padding: '5px',
                })}
              >
                {srcMode ? (
                  <ResizeHandle minSize={200}>
                    <EmbeddedSrcEditor
                      value={script.current}
                      onChange={onCodeChange}
                      minimap={false}
                      noGutter={true}
                      returnType={returnTypes(view.mode)}
                      scriptContext={
                        isServerScript ? 'Server internal' : 'Client'
                      }
                      Editor={WegasScriptEditor}
                      EmbeddedEditor={WegasScriptEditor}
                    />
                  </ResizeHandle>
                ) : (
                  <WyswygScriptEditor
                    expressions={statements}
                    onChange={e => {
                      onStatementsChange(e, operator);
                    }}
                    mode={view.mode}
                    controls={
                      <div className={cx(flex, justifyEnd, grow)}>
                        {!error && (
                          <IconButton
                            icon="code"
                            tooltip={i18nValues.variableProperties.toggleCoding}
                            pressed={error !== undefined}
                            onClick={() => setSrcMode(sm => !sm)}
                          />
                        )}
                        {view.mode === 'SET' && (
                          <IconButton
                            icon="play"
                            tooltip={i18nValues.variableProperties.runScripts}
                            onClick={() => testScript(script.current)}
                          />
                        )}
                        {isScriptCondition(view.mode) && (
                          <DropMenu
                            label={operator}
                            items={operators.map(o => ({ label: o, value: o }))}
                            onSelect={({ label }) => onSelectOperator(label)}
                            buttonClassName={secondaryButtonStyle}
                          />
                        )}
                      </div>
                    }
                  />
                )}
              </div>
            </>
          );
        }}
      </Labeled>
    </CommonViewContainer>
  );
}
