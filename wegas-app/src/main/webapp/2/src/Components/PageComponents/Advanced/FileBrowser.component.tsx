import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { WegasComponentProps } from '../tools/EditableComponent';
import { useScript } from '../../Hooks/useScript';
import { IScript, SListDescriptor } from 'wegas-ts-api';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { ComponentWithForm } from '../../../Editor/Components/FormView/ComponentWithForm';
import { CTree } from '../../../Editor/Components/Variable/VariableTree';

interface PlayerFileBrowserProps extends WegasComponentProps {
  list?: IScript;
}

export default function PlayerFileBrowser({
  list,
  context,
  className,
  style,
  id,
}: PlayerFileBrowserProps) {
  const rootDirectory = useScript<SListDescriptor>(list, context);
  const rootDirectoryId = rootDirectory?.getId();

  return rootDirectoryId == null ? (
    <pre className={className} style={style} id={id}>
      File not found
    </pre>
  ) : (
    <ComponentWithForm entityEditor>
      {({ localDispatch }) => {
        return (
          <CTree
            variableId={rootDirectoryId}
            localDispatch={localDispatch}
            forceLocalDispatch
            nodeProps={() => ({})}
          />
        );
      }}
    </ComponentWithForm>
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerFileBrowser,
    componentType: 'Advanced',
    name: 'File browser',
    icon: 'atom',
    schema: {
      list: schemaProps.scriptVariable({
        label: 'Root dir',
        required: true,
        returnType: ['SListDescriptor'],
      }),
    },
    allowedVariables: ['ListDescriptor'],
    getComputedPropsFromVariable: v => ({
      list: createFindVariableScript(v),
      style: {
        overflow: 'auto',
      },
    }),
  }),
);
