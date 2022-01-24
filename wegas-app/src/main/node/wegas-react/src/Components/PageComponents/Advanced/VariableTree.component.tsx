import * as React from 'react';
import { IScript, SListDescriptor } from 'wegas-ts-api';
import {
  ComponentWithForm,
  ComponentWithFormFlexValues,
  flexValuesSchema,
} from '../../../Editor/Components/FormView/ComponentWithForm';
import { VariableTreeView } from '../../../Editor/Components/Variable/VariableTreeView';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { useScript } from '../../Hooks/useScript';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { schemaProps } from '../tools/schemaProps';

interface PlayerVariableTreeProps extends WegasComponentProps {
  list?: IScript;
  flexValues?: ComponentWithFormFlexValues;
}

export default function PlayerVariableTree({
  list,
  flexValues,
  context,
  className,
  style,
  id,
  options,
}: PlayerVariableTreeProps) {
  const rootDirectory = useScript<SListDescriptor>(list, context);

  return rootDirectory == null ? (
    <pre className={className} style={style} id={id}>
      File not found
    </pre>
  ) : (
    <ComponentWithForm
      flexValues={flexValues}
      disabled={options.disabled || options.locked}
      readOnly={options.readOnly}
    >
      {({ localDispatch, localState }) => {
        return (
          <VariableTreeView
            root={rootDirectory.getEntity()}
            noHeader
            localState={localState}
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
    illustration: 'variableTree',
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
  }),
);

//Obsolete component once named 'File browser'
registerComponent(
  pageComponentFactory({
    component: PlayerVariableTree,
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
