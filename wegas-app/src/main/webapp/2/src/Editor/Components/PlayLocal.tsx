import { css } from 'emotion';
import * as React from 'react';
import { useDebounce } from '../../Components/Hooks/useDebounce';
import { useScript } from '../../Components/Hooks/useScript';
import { shallowIs } from '../../Helper/shallowIs';
import SrcEditor from './ScriptEditors/SrcEditor';

const container = css({ width: '100%' });
const editor = css({ width: '100%', height: '400px' });

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
      return <div>{this.state.error.message}</div>;
    }
    return this.props.children;
  }
}

const Eval = React.memo(function Eval({ script }: { script: string }) {
  const val = useScript(script);
  return <pre>{JSON.stringify(val, null, 2)}</pre>;
});
Eval.displayName = 'Eval';

export function PlayLocal() {
  const [script, setScript] = React.useState('Varia');
  const debouncedScript = useDebounce(script, 300);

  return (
    <div className={container}>
      <div className={editor}>
        <SrcEditor
          language="javascript"
          value={script}
          onChange={e => setScript(e)}
        />
      </div>
      <ErrorBoundary script={debouncedScript}>
        <Eval script={debouncedScript} />
      </ErrorBoundary>
    </div>
  );
}