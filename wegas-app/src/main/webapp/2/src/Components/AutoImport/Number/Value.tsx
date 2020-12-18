import * as React from 'react';
import { TranslatableContent } from '../../../data/i18n';
import {
  useVariableDescriptor,
  useVariableInstance,
} from '../../Hooks/useVariable';
import { INumberDescriptor } from 'wegas-ts-api';
import { TumbleLoader } from '../../Loader';
import { wwarn } from '../../../Helper/wegaslog';

export default function NumberValue(props: { variable: string }) {
  const descriptor = useVariableDescriptor<INumberDescriptor>(props.variable);
  const instance = useVariableInstance(descriptor);
  if (descriptor === undefined || instance === undefined) {
    wwarn(`Not found: ${props.variable}`);
    return <TumbleLoader />;
  }
  const label = TranslatableContent.toString(descriptor.label);
  return (
    <div>
      {label && <span>{label}: </span>}
      {instance.getValue()}
    </div>
  );
}
