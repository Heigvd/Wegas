import { css } from 'emotion';
import * as React from 'react';
import { useDebounce } from '../../Components/Hooks/useDebounce';
import { useScript } from '../../Components/Hooks/useScript';
import { shallowIs } from '../../Helper/shallowIs';
import { WegasScriptEditor } from './ScriptEditors/WegasScriptEditor';

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

// const testScript = 'Variable.find(gameModel,"initGroups");';
// const testScript = `Modals.addModal("TESUS","Hello there!");`;
const testScript = `
WegasEvents.addEventHandler('manageOutOfBound', 'ExceptionEvent', event => {
  Modals.addModal('test', 'Registered');
  event.exceptions
    .filter(ex => ex['@class'] === 'WegasOutOfBoundException')
    .map((ex: WegasOutOfBoundException) => {
      if (ex.variableName === 'timeCards') {
        Modals.addModal('notime', 'No more time');
      } else if (ex.variableName === 'caisse') {
        Modals.addModal('nomoney', 'No more money');
      }
    });
});
`;

export default function PlayLocal() {
  const [script, setScript] = React.useState(testScript);
  const debouncedScript = useDebounce(script, 300);
  return (
    <div className={container}>
      <div className={editor}>
        <WegasScriptEditor
          value={script}
          onChange={e => setScript(e)}
          // returnType={['number']}
        />
      </div>
      <ErrorBoundary script={debouncedScript}>
        <Eval script={debouncedScript} />
      </ErrorBoundary>
    </div>
  );
}
