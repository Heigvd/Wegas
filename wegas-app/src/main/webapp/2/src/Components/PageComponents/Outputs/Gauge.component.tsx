import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { StandardGauge } from '../../Outputs/StandardGauge';
import { WegasComponentProps } from '../tools/EditableComponent';
import { useComponentScript } from '../../Hooks/useComponentScript';

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
      min={descriptor!.minValue || 0}
      max={descriptor!.maxValue || 1}
      value={instance!.value}
    />
  );
}

registerComponent(
  pageComponentFactory(
    PlayerGauge,
    'Gauge',
    'tachometer-alt',
    {
      script: schemaProps.scriptVariable('Variable', false, [
        'NumberDescriptor',
      ]),
      label: schemaProps.string('Label', false),
      followNeedle: schemaProps.boolean('Follow needle', false),
    },
    [],
    () => ({}),
  ),
);
