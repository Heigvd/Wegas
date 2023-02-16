import { WidgetProps } from 'jsoninput/typings/types';
import * as React from 'react';
import { VariableContext } from '.';
import {
  editorLabel,
} from '../../../data/methods/VariableDescriptorMethods';
import * as VariableDescriptor from '../../../data/selectors/VariableDescriptorSelector';
import { CommonView } from './commonView';
import { LabeledView } from './labeled';
import Select from './Select';

interface IName {
  values: string[];
  separator: string;
}

interface IEntityArrayFieldSelectProps extends WidgetProps.BaseProps {
  context?: VariableContext,
  view: {
    returnAttr: string;
    //scope: 'instance' | string;
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
  const { field, returnAttr, name, ...restView } = props.view;
  const computedEntity = context.variableName
    ? VariableDescriptor.findByName(context.variableName)
    : props.formValue;
  if (!computedEntity) {
    return <pre>No computed entity found</pre>;
  }

  const options = (computedEntity as Record<string, unknown>)[field];
    /* XGO: scope is never defined
      scope !== 'instance'
      ? (computedEntity as Record<string, unknown>)[field]
      : (
          getInstance(computedEntity as IVariableDescriptor) as Record<
            string,
            unknown
          >
        )[field];
    */

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

  if (props.schema.required) {
    if (
      props.value != null &&
      choices.filter(v => v.value === props.value).length > 0
    ) {
      props.onChange(props.value);
    } else {
      if (choices[0] != null) {
        props.onChange(choices[0].value);
      }
    }
  }

  return <Select {...props} view={{ ...restView, choices }} />;
}

export default EntityArrayFieldSelect;
