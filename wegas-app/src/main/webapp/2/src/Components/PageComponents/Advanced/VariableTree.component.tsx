import * as React from 'react';
import { IScript, SListDescriptor } from 'wegas-ts-api';
import { ComponentWithForm } from '../../../Editor/Components/FormView/ComponentWithForm';
import { TreeView } from '../../../Editor/Components/Variable/VariableTree';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { useScript } from '../../Hooks/useScript';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { schemaProps } from '../tools/schemaProps';

interface PlayerFileBrowserProps extends WegasComponentProps {
  list?: IScript;
}

export default function PlayerVariableTree({
  list,
  context,
  className,
  style,
  id,
  options,
}: PlayerFileBrowserProps) {
  const rootDirectory = useScript<SListDescriptor>(list, context);
  const rootDirectoryId = rootDirectory?.getId();

  return rootDirectoryId == null ? (
    <pre className={className} style={style} id={id}>
      File not found
    </pre>
  ) : (
    <ComponentWithForm
      entityEditor
      disabled={options.disabled || options.locked}
      readOnly={options.readOnly}
    >
      {({ localDispatch }) => {
        return (
          <TreeView
            variables={[rootDirectoryId]}
            noHeader
            noVisibleRoot
            localDispatch={localDispatch}
            forceLocalDispatch
            disabled={options.disabled || options.locked}
            readOnly={options.readOnly}
          />
        );
      }}
    </ComponentWithForm>
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerVariableTree,
    componentType: 'Advanced',
    name: 'Variable tree',
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