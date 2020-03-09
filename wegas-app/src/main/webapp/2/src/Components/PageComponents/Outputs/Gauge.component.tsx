import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
  extractProps,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { StandardGauge } from '../../Outputs/StandardGauge';
import { PageComponentMandatoryProps } from '../tools/EditableComponent';
import { useComponentScript } from '../../Hooks/useComponentScript';

interface PlayerGaugeProps extends PageComponentMandatoryProps {
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
  const { content, ComponentContainer, childProps, flexProps } = extractProps(
    props,
  );
  const { descriptor, instance, notFound } = useComponentScript<
    INumberDescriptor
  >(props.script);
  const min = descriptor.minValue || 0;
  const max = descriptor.maxValue || 1;
  return (
    <ComponentContainer flexProps={flexProps}>
      {notFound ? (
        <pre>Not found: {content}</pre>
      ) : (
        <StandardGauge
          label={childProps.label}
          followNeedle={childProps.followNeedle}
          min={min}
          max={max}
          value={instance.value}
        />
      )}
    </ComponentContainer>
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
