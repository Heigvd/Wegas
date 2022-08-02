import { css } from '@emotion/css';
import * as React from 'react';
import { handleError } from '../../Components/FormView/Script/Script';
import { Button } from '../../Components/Inputs/Buttons/Button';
import { TempScriptEditor } from '../../Components/ScriptEditors/TempScriptEditor';
import { defaultMargin } from '../../css/classes';
import { manageResponseHandler } from '../../data/actions';
import { asyncRunScript } from '../../data/Reducer/VariableInstanceReducer';
import { Player } from '../../data/selectors';
import { editingStore } from '../../data/Stores/editingStore';

const container = css({ width: '100%' });
const editor = css({ width: '100%', height: '400px' });

const filename = 'play:server.js';

export default function PlayServer() {
  const [script, setScript] = React.useState('');
  const [output, setOutput] = React.useState<string>('');
  const [error, setError] = React.useState<string | undefined>();

  const playScript = React.useCallback(() => {
    try {
      setError(undefined);
      setOutput('');
      asyncRunScript(CurrentGM.id!, script, Player.selectCurrent()).then(
        result => {
          setOutput(JSON.stringify(result));
          editingStore.dispatch(manageResponseHandler(result));
        },
      );
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
          <pre>{output}</pre>
        </div>
      </div>
    </div>
  );
}
