import { IScript } from 'wegas-ts-api';
import { runLoadedScript } from '../../../data/Reducer/VariableInstanceReducer';
import { Player } from '../../../data/selectors';
import { store } from '../../../data/Stores/store';
import { createScript } from '../../../Helper/wegasEntites';
import { safeClientScriptEval, useScript } from '../../Hooks/useScript';
import { clientAndServerScriptChoices } from '../tools/options';
import { schemaProps } from '../tools/schemaProps';

/**
 * OnFileClick - the script to execute when a file is clicked.
 * The file is added in the context as an IAbstractContentDescriptor
 */
export interface OnVariableChange {
  /**
   * exposeVariableAs - the id of the stored file in Context
   */
  exposeVariableAs?: IScript;
  /**
   * client - the client script
   */
  client?: IScript;
  /**
   * server - the server script
   */
  server?: IScript;
}

export const onVariableChangeSchema = (label: string) =>
  schemaProps.hashlist({
    label,
    required: false,
    choices: [
      {
        label: 'Expose variable as',
        value: {
          prop: 'exposeVariableAs',
          schema: schemaProps.scriptString({
            label: 'Expose variable as',
            value: createScript('"value"'),
          }),
        },
      },
      ...clientAndServerScriptChoices,
    ],
  });

export function useOnVariableChange(
  onVariableChange?: OnVariableChange,
  context?: {
    [name: string]: unknown;
  },
) {
  const {
    client,
    server,
    exposeVariableAs: exposeFileAs = createScript('"file"'),
  } = onVariableChange || {};

  const exposeAs = useScript<string>(exposeFileAs, context) || 'file';

  function handleOnChange(variable: any) {
    const newContext = { ...context, [exposeAs]: variable };
    if (client) {
      safeClientScriptEval(client, newContext);
    }
    if (server) {
      store.dispatch(
        runLoadedScript(server, Player.selectCurrent(), undefined, newContext),
      );
    }
  }

  if (!onVariableChange || Object.keys(onVariableChange).length === 0) {
    return {};
  } else {
    return { client, server, exposeAs, handleOnChange };
  }
}
