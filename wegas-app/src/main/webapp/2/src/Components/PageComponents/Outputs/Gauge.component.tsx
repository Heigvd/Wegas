import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { StandardGauge } from '../../Outputs/StandardGauge';
import { WegasFunctionnalComponentProps } from '../tools/EditableComponent';
import { useComponentScript } from '../../Hooks/useComponentScript';
import { IScript, INumberDescriptor } from 'wegas-ts-api/typings/WegasEntities';

interface PlayerGaugeProps extends WegasFunctionnalComponentProps {
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
  pageComponentFactory(
    PlayerGauge,
    'Output',
    'Gauge',
    'tachometer-alt',
    {
      script: schemaProps.scriptVariable('Variable', false, [
        'SNumberDescriptor',
      ]),
      label: schemaProps.string('Label', false),
      followNeedle: schemaProps.boolean('Follow needle', false),
    },
    [],
    () => ({}),
  ),
);
