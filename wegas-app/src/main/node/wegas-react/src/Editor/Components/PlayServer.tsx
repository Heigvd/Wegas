import { css } from '@emotion/css';
import * as React from 'react';
import { WegasScriptEditor } from './ScriptEditors/WegasScriptEditor';
import { Button } from '../../Components/Inputs/Buttons/Button';
import { Player } from '../../data/selectors';
import { store } from '../../data/Stores/store';
import { runScript } from '../../data/Reducer/VariableInstanceReducer';
import { defaultMargin } from '../../css/classes';

const container = css({ width: '100%' });
const editor = css({ width: '100%', height: '400px' });

const filename = 'play:server.js';

export default function PlayServer() {
  const [script, setScript] = React.useState('');
  const [error, setError] = React.useState<string | undefined>();

  const playScript = React.useCallback(() => {
    try {
      store.dispatch(runScript(script, Player.selectCurrent()));
      setError(undefined);
    } catch (error) {
      setError(error.message);
    }
  }, [script]);

  return (
    <div className={container}>
      <div className={editor}>
        <WegasScriptEditor
          models={{ [filename]: script }}
          fileName={filename}
          onChange={e => setScript(e)}
          scriptContext="Server internal"
        />
        <div className={defaultMargin}>
          <Button onClick={playScript} label="Run script" />
          <div>{error}</div>
        </div>
      </div>
    </div>
  );
}
