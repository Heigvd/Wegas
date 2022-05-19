import * as React from 'react';
import { INumberDescriptor, IScript } from 'wegas-ts-api';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { useComponentScript } from '../../Hooks/useComponentScript';
import { NumberBox } from '../../Inputs/Number/NumberBox';
import { UncompleteCompMessage } from '../../UncompleteCompMessage';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { classStyleIdShema } from '../tools/options';
import { schemaProps } from '../tools/schemaProps';

interface PlayerBoxesProps extends WegasComponentProps {
  /**
   * script - the script that returns the variable to display and modify
   */
  script?: IScript;
  /**
   * label - The label to display with the gauge
   */
  label?: string;
  /**
   * hideBoxValue - hide the value in the box
   */
  hideBoxValue?: boolean;
  /**
   * showLabelValue - show the value of the number in the label
   */
  showLabelValue?: boolean;
}

function PlayerBoxes({
  script,
  context,
  label,
  hideBoxValue,
  showLabelValue,
  className,
  style,
  id,
  options,
  pageId,
  path,
}: PlayerBoxesProps) {
  const { descriptor, instance, notFound } =
    useComponentScript<INumberDescriptor>(script, context);

  return notFound ? (
    <UncompleteCompMessage pageId={pageId} path={path} />
  ) : (
    <NumberBox
      className={className}
      style={style}
      id={id}
      value={instance?.getValue()}
      minValue={
        descriptor?.getMinValue() != null
          ? (descriptor.getMinValue() as number)
          : undefined
      }
      maxValue={
        descriptor?.getMaxValue() != null
          ? (descriptor.getMaxValue() as number)
          : undefined
      }
      label={label}
      hideBoxValue={hideBoxValue}
      showLabelValue={showLabelValue}
      disabled={options.disabled || options.locked}
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerBoxes,
    componentType: 'Output',
    id: 'Boxes',
    name: 'Boxes',
    icon: 'ellipsis-h',
    illustration: 'boxes',
    schema: {
      script: schemaProps.scriptVariable({
        label: 'Variable',
        required: false,
        returnType: ['SNumberDescriptor'],
      }),
      label: schemaProps.string({ label: 'Label' }),
      hideBoxValue: schemaProps.boolean({ label: 'Hide value in boxes' }),
      showLabelValue: schemaProps.boolean({ label: 'Show value in label' }),
      ...classStyleIdShema,
    },
    allowedVariables: ['NumberDescriptor', 'TextDescriptor'],
    getComputedPropsFromVariable: v => ({
      script: createFindVariableScript(v),
    }),
  }),
);
