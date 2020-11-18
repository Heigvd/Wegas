import * as React from 'react';
import {
  registerComponent,
  pageComponentFactory,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { store } from '../../../data/store';
import { WegasComponentProps } from '../tools/EditableComponent';
import { IScript } from 'wegas-ts-api';
import { createScript } from '../../../Helper/wegasEntites';
import {
  parseAndRunClientScript,
  safeClientScriptEval,
  useScript,
} from '../../Hooks/useScript';
import {
  classStyleIdShema,
  clientAndServerScriptChoices,
} from '../tools/options';
import { runScript } from '../../../data/Reducer/VariableInstanceReducer';
import { Player } from '../../../data/selectors';
import {
  FileBrowser,
  FileBrowserProps,
} from '../../../Editor/Components/FileBrowser/FileBrowser';

interface PlayerFileInputProps
  extends WegasComponentProps,
    Omit<FileBrowserProps, 'onFileClick'> {
  /**
   * onFileClick - the script to execute when a file is clicked.
   * The file is added in the context as an IAbstractContentDescriptor
   */
  onFileClick?: {
    /**
     * exposeFileAs - the id of the stored file in Context
     */
    exposeFileAs?: IScript;
    /**
     * client - the client script
     */
    client?: IScript;
    /**
     * server - the server script
     */
    server?: IScript;
  };
}

function PlayerFileInput({
  // placeholder,
  onFileClick,
  context,
  // pick,
  // filter,
  // options,
  className,
  style,
  id,
}: PlayerFileInputProps) {
  const { client, server, exposeFileAs = createScript('"file"') } =
    onFileClick || {};

  const exposeAs = useScript<string>(exposeFileAs, context) || 'file';

  return (
    <FileBrowser
      className={className}
      style={style}
      id={id}
      onFileClick={file => {
        const newContext = { ...context, [exposeAs]: file };
        if (client) {
          safeClientScriptEval(client, newContext);
        }
        if (server) {
          store.dispatch(
            runScript(
              parseAndRunClientScript(server, newContext),
              Player.selectCurrent(),
            ),
          );
        }
      }}
      pick={'FILE'}
      filter={{ fileType: 'image', filterType: 'show' }}
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerFileInput,
    componentType: 'Input',
    name: 'File input',
    icon: 'image',
    schema: {
      onFileClick: schemaProps.hashlist({
        label: 'On file click actions',
        required: true,
        choices: [
          {
            label: 'Expose file as',
            value: {
              prop: 'exposeFileAs',
              schema: schemaProps.scriptString({
                label: 'Expose file as',
                value: createScript('"file"'),
              }),
            },
          },
          ...clientAndServerScriptChoices,
        ],
      }),
      ...classStyleIdShema,
    },
  }),
);
