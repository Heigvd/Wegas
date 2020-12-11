import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { WegasComponentProps } from '../tools/EditableComponent';
import { useComponentScript } from '../../Hooks/useComponentScript';
import { NumberBox } from '../../Inputs/Number/NumberBox';
import { IScript, INumberDescriptor } from 'wegas-ts-api';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { classStyleIdShema } from '../tools/options';

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
  label,
  hideBoxValue,
  showLabelValue,
  className,
  style,
  id,
}: PlayerBoxesProps) {
  const { content, descriptor, instance, notFound } = useComponentScript<
    INumberDescriptor
  >(script);
  return notFound ? (
    <pre className={className} style={style} id={id}>
      Not found: {content}
    </pre>
  ) : (
    <NumberBox
      className={className}
      style={style}
      id={id}
      value={instance?.value}
      minValue={1}
      maxValue={
        descriptor?.getMaxValue() != null
          ? (descriptor.getMaxValue() as number)
          : undefined
      }
      label={label}
      hideBoxValue={hideBoxValue}
      showLabelValue={showLabelValue}
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerBoxes,
    componentType: 'Output',
    name: 'Boxes',
    icon: 'ellipsis-h',
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
