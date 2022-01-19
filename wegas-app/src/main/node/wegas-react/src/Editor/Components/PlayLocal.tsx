import { css, cx } from '@emotion/css';
import * as React from 'react';
import { useDebounce } from '../../Components/Hooks/useDebounce';
import { useUnsafeScript } from '../../Components/Hooks/useScript';
import { Toggler } from '../../Components/Inputs/Boolean/Toggler';
import { Button } from '../../Components/Inputs/Buttons/Button';
import { themeVar } from '../../Components/Theme/ThemeVars';
import { Toolbar } from '../../Components/Toolbar';
import { defaultPadding, flex } from '../../css/classes';
import { shallowIs } from '../../Helper/shallowIs';
import { WegasScriptEditor } from './ScriptEditors/WegasScriptEditor';

const container = css({ width: '100%' });
const editor = css({ width: '100%', height: '400px' });
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

const Eval = React.memo(function Eval({ script }: { script: string }) {
  const val = useUnsafeScript(script);
  return <pre className={overlayStyle}>{JSON.stringify(val, null, 2)}</pre>;
});
Eval.displayName = 'Eval';

export default function PlayLocal() {
  const [script, setScript] = React.useState('');

  const [tmpScript, setTmpScript] = React.useState('');

  const debouncedScript = useDebounce(script, 300);

  const [autorun, setAutorun] = React.useState(true);

  const onChangeCb = React.useCallback(
    (newScript: string) => {
      setTmpScript(newScript);
      if (autorun) {
        setScript(newScript);
      }
    },
    [autorun],
  );

  const onRunCb = React.useCallback(() => {
    setScript(tmpScript);
  }, [tmpScript]);

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
            <WegasScriptEditor value={script} onChange={onChangeCb} />
          </div>
          <ErrorBoundary script={debouncedScript}>
            <Eval script={debouncedScript} />
          </ErrorBoundary>
        </div>
      </Toolbar.Content>
    </Toolbar>
  );
}
