import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { WegasComponentProps } from '../tools/EditableComponent';
import { useComponentScript } from '../../Hooks/useComponentScript';
import { NumberBox } from '../../Inputs/Number/NumberBox';
import { IScript, INumberDescriptor } from 'wegas-ts-api/typings/WegasEntities';

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
}: PlayerBoxesProps) {
  const { content, descriptor, instance, notFound } = useComponentScript<
    INumberDescriptor
  >(script);
  return notFound ? (
    <pre>Not found: {content}</pre>
  ) : (
    <NumberBox
      value={instance?.value}
      minValue={1}
      maxValue={descriptor?.maxValue == null ? undefined : descriptor?.maxValue}
      label={label}
      hideBoxValue={hideBoxValue}
      showLabelValue={showLabelValue}
    />
  );
}

registerComponent(
  pageComponentFactory(
    PlayerBoxes,
    'Output',
    'Boxes',
    'box',
    {
      script: schemaProps.scriptVariable('Variable', false, [
        'ISNumberDescriptor',
      ]),
      label: schemaProps.string('Label', false),
      hideBoxValue: schemaProps.boolean('Hide value in boxes', false),
      showLabelValue: schemaProps.boolean('Show value in label', false),
    },
    [],
    () => ({}),
  ),
);
