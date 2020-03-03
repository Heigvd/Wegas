import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
  PageComponentMandatoryProps,
} from '../tools/componentFactory';
import { CustomGaugeProps, CustomGauge } from '../../Outputs/CustomGauge';
import { schemaProps } from '../tools/schemaProps';

function PlayerGauge(props: CustomGaugeProps & PageComponentMandatoryProps) {
  const { EditHandle } = props;
  return (
    <>
      <EditHandle />
      <CustomGauge {...props} />
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
    () => ({
      value: 0,
      minAngle: 0,
      maxAngle: 180,
      min: 0,
      sections: [],
    }),
  ),
);
