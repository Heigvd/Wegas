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
import { useScript } from '../../../../Components/Hooks/useScript';
import { WyswygScriptEditor } from './WyswygScriptEditor';

function useDebounce(fn: () => void, duration: number = 100) {
  const timer = React.useRef<NodeJS.Timeout>();
  if (timer.current !== undefined) {
    clearTimeout(timer.current);
  }
  timer.current = setTimeout(fn, duration);
}

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

export interface ScriptView {
  mode?: ScriptMode;
  singleExpression?: boolean;
  clientScript?: boolean;
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
  const [error, setError] = React.useState();
  const [srcMode, setSrcMode] = React.useState(false);
  const [scriptContent, setScriptContent] = React.useState(
    value == null ? '' : typeof value === 'string' ? value : value.content,
  );

  const testScript = React.useCallback(() => {
    try {
      //   if (view.clientScript) {
      //     useScript(scriptContent);
      //   } else {
      store.dispatch(runScript(scriptContent, Player.selectCurrent(), context));
      //   }
    } catch (error) {
      setError(error.message);
    }
  }, [context, scriptContent]);

  const onCodeChange = React.useCallback(
    (value: string) => {
      if (timer.current !== undefined) {
        clearTimeout(timer.current);
      }
      timer.current = setTimeout(
        () =>
          setScriptContent(() => {
            onChange({
              '@class': 'Script',
              language: 'JavaScript',
              content: value,
            });
            return value;
          }),
        100,
      );

      //   useDebounce(() =>
      //     setScriptContent(() => {
      //       onChange({
      //         '@class': 'Script',
      //         language: 'JavaScript',
      //         content: value,
      //       });
      //       return value;
      //     }),
      //   );
    },
    [onChange],
  );

  return (
    <CommonViewContainer
      view={view}
      errorMessage={error ? [error] : errorMessage}
    >
      <Labeled label={view.label} description={view.description} /*{...view}*/>
        {({ labelNode }) => {
          return (
            <>
              {labelNode}
              <IconButton
                icon="code"
                pressed={error}
                onClick={() => setSrcMode(sm => !sm)}
              />
              <IconButton icon="play" onClick={testScript} />
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
                  script={scriptContent}
                  onChange={onChange}
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
