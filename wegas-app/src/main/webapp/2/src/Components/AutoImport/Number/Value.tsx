import * as React from 'react';
import { TranslatableContent } from '../../../data/i18n';
import {
  useVariableDescriptor,
  useVariableInstance,
} from '../../Hooks/useVariable';
import { INumberDescriptor } from 'wegas-ts-api';

export default function NumberValue(props: { variable: string }) {
  const descriptor = useVariableDescriptor<INumberDescriptor>(props.variable);
  const instance = useVariableInstance(descriptor);
  if (descriptor === undefined || instance === undefined) {
    return <span>Not found: {props.variable}</span>;
  }
  const label = TranslatableContent.toString(descriptor.label);
  return (
    <div>
      {label && <span>{label}: </span>}
      {instance.value}
    </div>
  );
}
