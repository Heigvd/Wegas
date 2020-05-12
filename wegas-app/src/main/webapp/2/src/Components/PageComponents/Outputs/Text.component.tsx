import * as React from 'react';
import { Text, TextProps } from '../../Outputs/Text';
import {
  registerComponent,
  pageComponentFactory,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { WegasComponentProps } from '../tools/EditableComponent';

function PlayerText(props: TextProps & WegasComponentProps) {
  return <Text {...props} style={{ margin: 'auto', ...props.style }} />;
}

registerComponent(
  pageComponentFactory(
    PlayerText,
    'Text',
    'paragraph',
    {
      script: schemaProps.scriptVariable('Variable', true, ['TextDescriptor']),
      className: schemaProps.string('ClassName', false),
    },
    ['ISTextDescriptor'],
    () => ({}),
  ),
);
