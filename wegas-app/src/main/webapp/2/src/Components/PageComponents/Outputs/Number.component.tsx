import * as React from 'react';
import {
  registerComponent,
  pageComponentFactory,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { WegasComponentProps } from '../tools/EditableComponent';
import { useComponentScript } from '../../Hooks/useComponentScript';
import { IScript, INumberDescriptor } from 'wegas-ts-api';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { classStyleIdShema } from '../tools/options';
import { TumbleLoader } from '../../Loader';
import { halfOpacity } from '../../../css/classes';
import { classOrNothing } from '../../../Helper/className';

export interface PlayerNumberProps extends WegasComponentProps {
  script?: IScript;
}

function PlayerNumber({
  script,
  className,
  style,
  id,
  options,
}: PlayerNumberProps) {
  const { instance, notFound } = useComponentScript<INumberDescriptor>(script);
  return notFound ? (
    <TumbleLoader />
  ) : (
    <div
      id={id}
      className={
        className +
        classOrNothing(halfOpacity, options.disabled || options.locked)
      }
      style={style}
    >
      {instance?.getValue()}
    </div>
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerNumber,
    componentType: 'Output',
    name: 'Number',
    icon: 'calculator',
    schema: {
      script: schemaProps.scriptVariable({
        label: 'Variable',
        required: true,
        returnType: ['SNumberDescriptor'],
      }),
      ...classStyleIdShema,
    },
    allowedVariables: ['NumberDescriptor'],
    getComputedPropsFromVariable: v => ({
      script: createFindVariableScript(v),
    }),
  }),
);
