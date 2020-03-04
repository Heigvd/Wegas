import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
  PageComponentMandatoryProps,
} from '../tools/componentFactory';
import { GaugeProps, Gauge } from '../../Outputs/Gauge';
import { schemaProps } from '../tools/schemaProps';

function PlayerGauge(props: GaugeProps & PageComponentMandatoryProps) {
  const { EditHandle } = props;
  return (
    <>
      <EditHandle />
      <Gauge {...props} />
    </>
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
      neutralValue: schemaProps.number('Neutral value', false),
      positiveColor: schemaProps.string('Positive color', false),
      negativeColor: schemaProps.string('Negative color', false),
    },
    [],
    () => ({}),
  ),
);
