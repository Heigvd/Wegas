import { css } from '@emotion/css';
import * as React from 'react';
import { Button } from '../../Components/Inputs/Buttons/Button';
import { defaultMargin } from '../../css/classes';
import { runScript } from '../../data/Reducer/VariableInstanceReducer';
import { Player } from '../../data/selectors';
import { editingStore } from '../../data/Stores/editingStore';
import { handleError } from './FormView/Script/Script';
import { TempScriptEditor } from './ScriptEditors/TempScriptEditor';

const container = css({ width: '100%' });
const editor = css({ width: '100%', height: '400px' });

const filename = 'play:server.js';

export default function PlayServer() {
  const [script, setScript] = React.useState('');
  const [error, setError] = React.useState<string | undefined>();

  const playScript = React.useCallback(() => {
    try {
      editingStore.dispatch(runScript(script, Player.selectCurrent()));
      setError(undefined);
    } catch (error) {
      setError(handleError(error));
    }
  }, [script]);

  return (
    <div className={container}>
      <div className={editor}>
        <TempScriptEditor
          fileName={filename}
          language="javascript"
          onChange={e => setScript(e)}
        />
        <div className={defaultMargin}>
          <Button onClick={playScript} label="Run script" />
          <div>{error}</div>
        </div>
      </div>
    </div>
  );
}
