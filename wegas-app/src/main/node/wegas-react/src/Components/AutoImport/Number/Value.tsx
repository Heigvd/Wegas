import * as React from 'react';
import {
  useVariableDescriptor,
  useVariableInstance,
} from '../../Hooks/useVariable';
import { INumberDescriptor } from 'wegas-ts-api';
import { TumbleLoader } from '../../Loader';
import { wwarn } from '../../../Helper/wegaslog';
import { useTranslate } from '../../Hooks/useTranslate';

export default function NumberValue(props: { variable: string }) {
  const descriptor = useVariableDescriptor<INumberDescriptor>(props.variable);
  const instance = useVariableInstance(descriptor);
  const label = useTranslate(descriptor?.label);

  if (descriptor === undefined || instance === undefined) {
    wwarn(`Not found: ${props.variable}`);
    return <TumbleLoader />;
  }
  return (
    <div>
      {label && <span>{label}: </span>}
      {instance.getValue()}
    </div>
  );
}
