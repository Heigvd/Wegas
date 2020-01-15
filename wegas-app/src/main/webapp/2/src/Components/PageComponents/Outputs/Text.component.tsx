import * as React from 'react';
import { Text, TextProps } from '../../Outputs/Text';
import {
  PageComponentMandatoryProps,
  registerComponent,
  pageComponentFactory,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';

function PlayerText(props: TextProps & PageComponentMandatoryProps) {
  const { EditHandle } = props;
  return (
    <>
      <EditHandle />
      <Text {...props} />
    </>
  );
}

registerComponent(
  pageComponentFactory(
    PlayerText,
    'Text',
    'paragraph',
    {
      script: schemaProps.scriptVariable(
        'Variable',
        true,
        ['TextDescriptor'],
        true,
      ),
      className: schemaProps.string('ClassName', false),
    },
    ['ISTextDescriptor'],
    () => ({}),
  ),
);
