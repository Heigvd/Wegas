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
import { IVariableDescriptor } from 'wegas-ts-api/typings/WegasEntities';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    return <pre>No computedEntity found</pre>;
  }

  const options =
    scope !== 'instance'
      ? (computedEntity as Record<string, unknown>)[field]
      : (getInstance(computedEntity as IVariableDescriptor) as Record<
          string,
          unknown
        >)[field];

  if (options == null) {
    return <pre>No attribute {field} found</pre>;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let aOptions: any[];
  if (Array.isArray(options)) {
    aOptions = options;
  } else if (typeof options === 'object' && options !== null) {
    aOptions = Object.values(options);
  } else {
    return <pre>Attribute {field} is not iterable</pre>;
  }

  const choices = aOptions.map(r => ({
    value: r[returnAttr || 'name'],
    label: optionNameToString(r, name),
  }));
  return <Select {...props} view={{ ...restView, choices }} />;
}

export default EntityArrayFieldSelect;
