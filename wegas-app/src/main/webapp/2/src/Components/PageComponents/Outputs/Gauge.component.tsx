import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { StandardGauge } from '../../Outputs/StandardGauge';
import { WegasComponentProps } from '../tools/EditableComponent';
import { useComponentScript } from '../../Hooks/useComponentScript';
import { IScript, INumberDescriptor } from 'wegas-ts-api';
import { createFindVariableScript } from '../../../Helper/wegasEntites';

interface PlayerGaugeProps extends WegasComponentProps {
  /**
   * script - the script that returns the variable to display and modify
   */
  script?: IScript;
  /**
   * label - The label to display with the gauge
   */
  label?: string;
  /**
   * followNeedle - if true, only the sections behind the needle will be displayed
   */
  followNeedle?: boolean;
}

function PlayerGauge(props: PlayerGaugeProps) {
  const { content, descriptor, instance, notFound } = useComponentScript<
    INumberDescriptor
  >(props.script);
  return notFound ? (
    <pre>Not found: {content}</pre>
  ) : (
    <StandardGauge
      label={props.label}
      followNeedle={props.followNeedle}
      min={descriptor!.getMinValue() || 0}
      max={descriptor!.getMaxValue() || 1}
      value={instance!.value}
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerGauge,
    componentType: 'Output',
    name: 'Gauge',
    icon: 'tachometer-alt',
    schema: {
      script: schemaProps.scriptVariable({
        label: 'Variable',
        required: false,
        returnType: ['SNumberDescriptor'],
      }),
      label: schemaProps.string({ label: 'Label' }),
      followNeedle: schemaProps.boolean({ label: 'Follow needle' }),
    },
    allowedVariables: ['NumberDescriptor'],
    getComputedPropsFromVariable: v => ({
      script: createFindVariableScript(v),
    }),
  }),
);
