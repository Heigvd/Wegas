import * as React from 'react';
import { IScript, SNumberDescriptor } from 'wegas-ts-api';
import { Player } from '../../../data/selectors';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { useScript } from '../../Hooks/useScript';
import { StandardGauge } from '../../Outputs/StandardGauge';
import { UncompleteCompMessage } from '../../UncompleteCompMessage';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { classStyleIdShema } from '../tools/options';
import { schemaProps } from '../tools/schemaProps';

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

function PlayerGauge({
  script,
  label,
  followNeedle,
  className,
  style,
  id,
  context,
  options,
  pageId,
  path,
}: PlayerGaugeProps) {
  const number = useScript<SNumberDescriptor>(script, context);

  return number == null ? (
    <UncompleteCompMessage pageId={pageId} path={path} />
  ) : (
    <StandardGauge
      className={className}
      style={style}
      id={id}
      label={label}
      followNeedle={followNeedle}
      min={number.getMinValue() || 0}
      max={number.getMaxValue() || 1}
      value={number.getValue(Player.self())}
      disabled={options.disabled || options.locked}
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerGauge,
    componentType: 'Output',
    name: 'Gauge',
    icon: 'tachometer-alt',
    illustration: 'gauge',
    schema: {
      script: schemaProps.scriptVariable({
        label: 'Variable',
        required: false,
        returnType: ['SNumberDescriptor'],
      }),
      label: schemaProps.string({ label: 'Label' }),
      followNeedle: schemaProps.boolean({ label: 'Follow needle' }),
      ...classStyleIdShema,
    },
    allowedVariables: ['NumberDescriptor'],
    getComputedPropsFromVariable: v => ({
      script: createFindVariableScript(v),
      // Prevent shrinking in chrome
      layoutStyle: {
        width: '100%',
      },
    }),
  }),
);
