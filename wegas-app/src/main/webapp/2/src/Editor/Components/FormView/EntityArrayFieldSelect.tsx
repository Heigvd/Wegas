import * as React from 'react';
import Select from './Select';
import { WidgetProps } from 'jsoninput/typings/types';
import { LabeledView } from './labeled';
import { CommonView } from './commonView';
import * as VariableDescriptor from '../../../data/selectors/VariableDescriptorSelector';
import {
  getInstance,
  editorLabel,
} from '../../../data/methods/VariableDescriptorMethods';

interface IName {
  values: string[];
  separator: string;
}

interface IEntityArrayFieldSelectProps extends WidgetProps.BaseProps {
  context?: {
    variableName?: string;
  };
  view: {
    returnAttr: string;
    scope: 'instance' | string;
    field: string;
    context?: {
      entity: string;
    };
    name: IName;
  } & CommonView &
    LabeledView;
}

function optionNameToString(result: any, name: IName) {
  const separator = name ? name.separator || ',' : ',';
  if (!name || !name.values || name.values.length <= 0) {
    if ('label' in result) {
      return editorLabel(result);
    } else {
      return 'undefined';
    }
  }
  return name.values.map(v => result[v]).join(separator);
}

function EntityArrayFieldSelect(props: IEntityArrayFieldSelectProps) {
  const context = props.context || {};
  const { field, returnAttr, scope, name, ...restView } = props.view;

  const computedEntity = context.variableName
    ? VariableDescriptor.first('name', context.variableName)
    : props.formValue;
  if (!computedEntity) {
    return <pre>No context found, variableName needed</pre>;
  }

  const results: unknown =
    scope !== 'instance'
      ? (computedEntity as Record<string, unknown>)[field]
      : (getInstance(computedEntity as IVariableDescriptor) as Record<
          string,
          unknown
        >)[field];

  if (results == null) {
    return null;
  }

  let aResults: unknown;
  if (Array.isArray(results)) {
    aResults = results;
  } else if (typeof results === 'object' && results !== null) {
    aResults = Object.values(results);
  } else {
    return null;
  }
  if (!Array.isArray(aResults)) {
    return null;
  }
  const choices = aResults.map(r => ({
    value: r[returnAttr || 'name'],
    label: optionNameToString(r, name),
  }));
  return <Select {...props} view={{ ...restView, choices }} />;
}

export default EntityArrayFieldSelect;
