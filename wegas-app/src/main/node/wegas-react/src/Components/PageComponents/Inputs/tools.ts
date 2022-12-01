import * as React from 'react';
import { IScript } from 'wegas-ts-api';
import { runLoadedScript } from '../../../data/Reducer/VariableInstanceReducer';
import { Player } from '../../../data/selectors';
import { editingStore } from '../../../data/Stores/editingStore';
import { usePagesContextStateStore } from '../../../data/Stores/pageContextStore';
import { createScript } from '../../../Helper/wegasEntites';
import { safeClientScriptEval, useScript } from '../../Hooks/useScript';
import { assembleStateAndContext } from '../tools/EditableComponent';
import { clientAndServerScriptChoices } from '../tools/options';
import { schemaProps } from '../tools/schemaProps';

export interface ClientAndServerAction {
  /**
   * client - the client script
   */
  client?: IScript;
  /**
   * server - the server script
   */
  server?: IScript;
}

/**
 * OnFileClick - the script to execute when a file is clicked.
 * The file is added in the context as an IAbstractContentDescriptor
 */
export interface OnVariableChange extends ClientAndServerAction {
  /**
   * exposeVariableAs - the id of the stored file in Context
   */
  exposeVariableAs?: IScript;
}

/**
 * Define a form schema for: {
 *   exposeVariableAs: IScript<SVariableDescriptor>;
 *   client?: IScript<ClientScript>
 *   server?: IScript<ServerScriptSetter>
 * }
 */
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
    exposeVariableAs: exposeFileAs = createScript('"value"'),
  } = onVariableChange || {};

  const exposeAs = useScript<string>(exposeFileAs, context) || 'value';

  const state = usePagesContextStateStore(s => s);

  const handleOnChange = React.useCallback(
    (variable: any) => {
      const newContext = { ...context, [exposeAs]: variable };

      if (client) {
        safeClientScriptEval(client, newContext, undefined, state, {
          injectReturn: false,
        });
      }
      if (server) {
        editingStore.dispatch(
          runLoadedScript(
            server,
            Player.selectCurrent(),
            undefined,
            assembleStateAndContext(newContext, state),
          ),
        );
      }
    },
    [client, context, exposeAs, server, state],
  );

  return React.useMemo(() => {
    if (!onVariableChange || Object.keys(onVariableChange).length === 0) {
      return {};
    } else {
      return { client, server, exposeAs, handleOnChange };
    }
  }, [client, exposeAs, handleOnChange, onVariableChange, server]);
}
