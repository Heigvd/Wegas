import * as React from 'react';
import { IScript, SListDescriptor } from 'wegas-ts-api';
import {
  ComponentWithForm,
  ComponentWithFormFlexValues,
  flexValuesSchema,
} from '../../../Editor/Components/FormView/ComponentWithForm';
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
  flexValues?: ComponentWithFormFlexValues;
}

export default function PlayerFileBrowser({
  list,
  flexValues,
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
      flexValues={flexValues}
      entityEditor
      disabled={options.disabled || options.locked}
      readOnly={options.readOnly}
    >
      {({ localDispatch }) => {
        return (
          // TODO : Implements a disable/readOnly/lock management on this component
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
    component: PlayerFileBrowser,
    componentType: 'Advanced',
    name: 'File browser',
    icon: 'atom',
    illustration: 'fileBrowser',
    schema: {
      list: schemaProps.scriptVariable({
        label: 'Root dir',
        required: true,
        returnType: ['SListDescriptor'],
      }),
      flexValues: flexValuesSchema,
    },
    allowedVariables: ['ListDescriptor'],
    getComputedPropsFromVariable: v => ({
      list: createFindVariableScript(v),
      style: {
        overflow: 'auto',
      },
    }),
    obsoleteComponent: {
      keepDisplayingToPlayer: true,
      isObsolete: oldComponent => oldComponent.type === 'File browser',
      sanitizer: (oldComponent: WegasComponent) => {
        oldComponent.type = 'Variable tree';
        return oldComponent;
      },
    },
  }),
);
