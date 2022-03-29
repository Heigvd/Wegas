import { css, cx } from '@emotion/css';
import * as React from 'react';
import { useDebounce } from '../../Components/Hooks/useDebounce';
import {
  clientScriptEval,
  useUnsafeScript,
} from '../../Components/Hooks/useScript';
import { Toggler } from '../../Components/Inputs/Boolean/Toggler';
import { Button } from '../../Components/Inputs/Buttons/Button';
import { themeVar } from '../../Components/Theme/ThemeVars';
import { Toolbar } from '../../Components/Toolbar';
import { defaultPadding, flex } from '../../css/classes';
import { shallowIs } from '../../Helper/shallowIs';
import { TempScriptEditor } from './ScriptEditors/TempScriptEditor';

const container = css({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
});
const editor = css({
  width: '100%',
  flexBasis: '1px',
  flexGrow: 2,
  flexShrink: 1,
  overflow: 'auto',
});
const togglerStyle = css({ padding: '0 15px 0 15px' });

class ErrorBoundary extends React.Component<Record<string, unknown>> {
  readonly state: { error?: Error } = { error: undefined };
  componentDidCatch(error: Error) {
    this.setState({ error });
  }
  componentDidUpdate(prevProps: Record<string, unknown>) {
    if (!shallowIs(prevProps, this.props)) {
      this.setState({ error: undefined });
    }
  }
  render() {
    if (this.state.error) {
      return (
        <div
          className={cx(
            defaultPadding,
            css({ color: themeVar.colors.ErrorColor }),
          )}
        >
          {this.state.error.message}
        </div>
      );
    }
    return this.props.children;
  }
}

const overlayStyle = css({ overflow: 'auto' });

const resultPanel = css({
  overflow: 'auto',
  flexGrow: 1,
  flexBasis: '1px',
});

const Eval = React.memo(function Eval({ script }: { script: string }) {
  const val = useUnsafeScript(script);
  return <pre className={overlayStyle}>{JSON.stringify(val, null, 2)}</pre>;
});
Eval.displayName = 'Eval';

export default function PlayLocal() {
  const [script, setScript] = React.useState('');

  const [result, setResult] = React.useState<unknown>();

  const [autorun, setAutorun] = React.useState(false);

  const debouncedScript = useDebounce(script, 300);

  const onChangeCb = React.useCallback((newScript: string) => {
    setScript(newScript);
  }, []);

  const onRunCb = React.useCallback(() => {
    setResult(undefined);
    try {
      setResult(clientScriptEval(script, undefined, undefined, undefined));
    } catch (e) {
      if (typeof e === 'object' && e != null && 'message' in e) {
        setResult((e as unknown as Error).message);
      } else {
        setResult(e);
      }
    }
  }, [script]);

  return (
    <Toolbar>
      <Toolbar.Header className={defaultPadding}>
        <div className={flex}>
          <Toggler
            className={togglerStyle}
            value={autorun}
            onChange={setAutorun}
            label="autorun"
          />
          {autorun ? null : <Button onClick={onRunCb} label="Run script" />}
        </div>
      </Toolbar.Header>
      <Toolbar.Content>
        <div className={container}>
          <div className={editor}>
            <TempScriptEditor
              initialValue={script}
              onChange={onChangeCb}
              language="typescript"
            />
          </div>
          <ErrorBoundary script={debouncedScript}>
            {autorun ? (
              <Eval script={debouncedScript} />
            ) : (
              <pre className={resultPanel}>
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </ErrorBoundary>
        </div>
      </Toolbar.Content>
    </Toolbar>
  );
}
