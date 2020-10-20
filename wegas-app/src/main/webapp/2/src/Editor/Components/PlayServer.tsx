import { css } from 'emotion';
import * as React from 'react';
import { WegasScriptEditor } from './ScriptEditors/WegasScriptEditor';
import { Button } from '../../Components/Inputs/Buttons/Button';
import { Player } from '../../data/selectors';
import { store } from '../../data/store';
import { runScript } from '../../data/Reducer/VariableInstanceReducer';
import { parseAndRunClientScript } from '../../Components/Hooks/useScript';

const container = css({ width: '100%' });
const editor = css({ width: '100%', height: '400px' });

export default function PlayServer() {
  const [script, setScript] = React.useState(
    'Variable.find(gameModel,"playerNumber").setValue(self,100)',
  );
  const [error, setError] = React.useState<string | undefined>();

  const playScript = React.useCallback(() => {
    try {
      store.dispatch(runScript(parseAndRunClientScript(script), Player.selectCurrent()));
      setError(undefined);
    } catch (error) {
      setError(error.message);
    }
  }, [script]);

  return (
    <div className={container}>
      <div className={editor}>
        <WegasScriptEditor
          value={script}
          onChange={e => setScript(e)}
          scriptContext="Server internal"
        />
        <Button onClick={playScript} label="Run script" />
        {error}
      </div>
    </div>
  );
}
