import { parse } from '@babel/parser';
import { css } from '@emotion/css';
import { WidgetProps } from 'jsoninput/typings/types';
import { isEqual } from 'lodash-es';
import * as React from 'react';
import { IScript, IVariableDescriptor, IVariableInstance } from 'wegas-ts-api';
import { DropMenu } from '../../../../Components/DropMenu';
import { IconButton } from '../../../../Components/Inputs/Buttons/IconButton';
import { themeVar } from '../../../../Components/Theme/ThemeVars';
import { flex, grow, secondaryButtonStyle } from '../../../../css/classes';
import { runScript } from '../../../../data/Reducer/VariableInstanceReducer';
import { Player } from '../../../../data/selectors';
import { editingStore } from '../../../../data/Stores/editingStore';
import { createScript } from '../../../../Helper/wegasEntites';
import { wwarn } from '../../../../Helper/wegaslog';
import { editorTabsTranslations } from '../../../../i18n/editorTabs/editorTabs';
import { useInternalTranslate } from '../../../../i18n/internalTranslator';
import { TempScriptEditor } from '../../ScriptEditors/TempScriptEditor';
import { CommonView, CommonViewContainer } from '../commonView';
import { Labeled, LabeledView } from '../labeled';
import { parseCodeIntoExpressions } from './Expressions/astManagement';
import { removeFinalSemicolon } from './Expressions/expressionEditorHelpers';
import { WyswygScriptEditor } from './WyswygScriptEditor';

/**
 * Try to extract error message from error
 */
export function handleError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  } else if (typeof error === 'string') {
    return error;
  } else {
    wwarn('UnhandledError: ', error);
    return 'Something went wong';
  }
}

export const scriptEditStyle = css({
  minHeight: '5em',
  //width: '500px',
});

const operators = ['&&', '||'] as const;

type Operator = typeof operators[number];

export function isServerScript(mode?: ScriptMode) {
  return mode === 'GET' || mode === 'SET';
}

export function isScriptCondition(mode?: ScriptMode) {
  return mode === 'GET' || mode === 'GET_CLIENT';
}

export function isClientMode(mode?: ScriptMode) {
  return mode === 'GET_CLIENT' || mode === 'SET_CLIENT';
}

export function returnTypes(mode?: ScriptMode): string[] | undefined {
  return mode === 'GET_CLIENT' ? ['boolean'] : undefined;
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
  const [statements, setStatements] = React.useState<string[]>([]);
  const [operator, setOperator] = React.useState<Operator>(operators[0]);
  const i18nValues = useInternalTranslate(editorTabsTranslations);

  const { mode, label, description } = view;
  const splitter = isScriptCondition(mode) ? operator : ';';

  const testScript = React.useCallback(
    (value: string | IScript) => {
      try {
        editingStore.dispatch(
          runScript(value, Player.selectCurrent(), context),
        );
        setError(undefined);
      } catch (error) {
        setError([handleError(error)]);
      }
    },
    [context],
  );

  const onCodeChange = React.useCallback(
    (value: string) => {
      if (value !== script.current) {
        script.current = value;
        onChange(
          createScript(value, isClientMode(mode) ? 'typescript' : 'javascript'),
        );
      }
    },
    [onChange, mode],
  );

  const onStatementsChange = React.useCallback(
    (statements: string[]) => {
      const newValue =
        statements.map(removeFinalSemicolon).join(splitter + '\n') + ';';
      try {
        parse(newValue, {
          sourceType: isClientMode(mode) ? 'module' : 'script',
        }).program.body;

        onCodeChange(newValue);
        setStatements(statements);
      } catch (e) {
        setError([handleError(e)]);
      }
    },
    [mode, onCodeChange, splitter],
  );

  const onSelectOperator = React.useCallback(
    (operator: Operator) => {
      setOperator(operator);
      if (!error && !srcMode) {
        // TODO : Something could be done when in src mode
        if (statements !== null) {
          onStatementsChange(statements);
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
        setStatements([]);
      } else {
        const newStatements = parseCodeIntoExpressions(newValue, mode);
        setStatements(oldStatements => {
          if (isEqual(oldStatements, newStatements)) {
            return oldStatements;
          } else {
            return newStatements;
          }
        });
      }
      setError(undefined);
    } catch (e) {
      setError([handleError(e)]);
    }
  }, [mode, value]);

  return (
    <CommonViewContainer view={view} errorMessage={error}>
      <Labeled label={label} description={description}>
        {({ labelNode }) => {
          return (
            <>
              <div className={flex}>
                <div className={grow}>{labelNode}</div>
                <IconButton
                  icon="code"
                  disabled={error != null}
                  tooltip={i18nValues.variableProperties.toggleCoding}
                  pressed={error !== undefined}
                  onClick={() => setSrcMode(sm => !sm)}
                />
                {mode === 'SET' && (
                  <IconButton
                    icon="play"
                    tooltip={i18nValues.variableProperties.runScripts}
                    onClick={() => testScript(script.current)}
                  />
                )}
                {!srcMode && isScriptCondition(mode) && (
                  <DropMenu
                    label={operator}
                    items={operators.map(o => ({ label: o, value: o }))}
                    onSelect={({ label }) => onSelectOperator(label)}
                    buttonClassName={secondaryButtonStyle}
                  />
                )}
              </div>
              <div
                className={css({
                  border: '1px solid ' + themeVar.colors.DisabledColor,
                  padding: '5px',
                })}
              >
                {srcMode ? (
                  <TempScriptEditor
                    language={
                      isServerScript(mode) ? 'javascript' : 'typescript'
                    }
                    initialValue={script.current}
                    onChange={onCodeChange}
                    minimap={false}
                    noGutter={true}
                    returnType={returnTypes(mode)}
                    resizable
                  />
                ) : (
                  <WyswygScriptEditor
                    expressions={statements}
                    onChange={onStatementsChange}
                    mode={mode}
                      setError={ errors => setError(errors)}
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
