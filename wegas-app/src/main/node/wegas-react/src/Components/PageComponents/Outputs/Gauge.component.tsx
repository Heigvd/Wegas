import * as React from 'react';
import { INumberDescriptor, IScript } from 'wegas-ts-api';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { commonTranslations } from '../../../i18n/common/common';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { useComponentScript } from '../../Hooks/useComponentScript';
import { StandardGauge } from '../../Outputs/StandardGauge';
import { UncompleteCompMessage } from '../../UncompleteCompMessage';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { classStyleIdSchema } from '../tools/options';
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
  const { somethingIsUndefined } = useInternalTranslate(commonTranslations);
  const { descriptor, instance, notFound } =
    useComponentScript<INumberDescriptor>(script, context);

  return notFound ? (
    <UncompleteCompMessage
      message={somethingIsUndefined('Number')}
      pageId={pageId}
      path={path}
    />
  ) : (
    <StandardGauge
      className={className}
      style={style}
      id={id}
      label={label}
      followNeedle={followNeedle}
      min={descriptor!.getMinValue() ?? 0}
      max={descriptor!.getMaxValue() ?? 1}
      value={instance!.getValue()}
      disabled={options.disabled || options.locked}
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerGauge,
    componentType: 'Output',
    id: 'Gauge',
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
      ...classStyleIdSchema,
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
