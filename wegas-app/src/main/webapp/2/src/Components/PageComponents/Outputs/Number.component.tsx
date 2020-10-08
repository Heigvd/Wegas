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

export interface PlayerNumberProps extends WegasComponentProps {
  script?: IScript;
}

function PlayerNumber({ script, className, style }: PlayerNumberProps) {
  const { content, instance } = useComponentScript<INumberDescriptor>(script);
  return instance == null || instance.value == null ? (
    <span>Not found: {content}</span>
  ) : (
    <div className={className} style={style}>
      {instance.value}
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
      className: schemaProps.string({ label: 'ClassName' }),
    },
    allowedVariables: ['NumberDescriptor'],
    getComputedPropsFromVariable: v => ({
      script: createFindVariableScript(v),
    }),
  }),
);
