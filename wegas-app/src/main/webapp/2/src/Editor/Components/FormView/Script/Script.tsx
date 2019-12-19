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
import { Statement, program } from '@babel/types';
import { parse } from '@babel/parser';
import generate from '@babel/generator';

export const scriptEditStyle = css({
  height: '5em',
  marginTop: '0.8em',
  width: '500px',
});

export type ScriptMode = 'SET' | 'GET' | 'NONE';

export type CodeLanguage =
  | 'JavaScript'
  | 'TypeScript'
  | 'CSS'
  | 'JSON'
  | 'PlainText';

export const scriptIsCondition = (
  mode?: ScriptMode,
  scriptableClassFilter?: WegasScriptEditorReturnTypeName[],
) => mode === 'GET' && scriptableClassFilter === undefined;

export interface ScriptView {
  mode?: ScriptMode;
  singleExpression?: boolean;
  // clientScript?: boolean;
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
  const timer = React.useRef<NodeJS.Timeout>();
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
      if (timer.current !== undefined) {
        clearTimeout(timer.current);
      }
      timer.current = setTimeout(() => {
        onChange({
          '@class': 'Script',
          language: 'JavaScript',
          content: value,
        });
        setScriptContent(() => {
          return value;
        });
      }, 100);
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
        const newScriptContent = scriptIsCondition(
          view.mode,
          view.scriptableClassFilter,
        )
          ? scriptContent.replace(/&&/gm, ';')
          : scriptContent;
        const newExpressions = parse(newScriptContent, { sourceType: 'script' })
          .program.body;
        if (view.singleExpression) {
          if (newExpressions.length > 1) {
            throw Error('Too much expressions for a single expression script');
          }
        }
        setExpressions(newExpressions);
      }
      setError(undefined);
    } catch (e) {
      setError([e.message]);
    }
  }, [
    scriptContent,
    view.singleExpression,
    view.mode,
    view.scriptableClassFilter,
  ]);

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
                  onChange={e => onCodeChange(generate(program(e)).code)}
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
