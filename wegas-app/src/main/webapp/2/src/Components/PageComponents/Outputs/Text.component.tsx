import * as React from 'react';
import { Text, TextProps } from '../../Outputs/Text';
import {
  registerComponent,
  pageComponentFactory,
  extractProps,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { PageComponentMandatoryProps } from '../tools/EditableComponent';

function PlayerText(props: TextProps & PageComponentMandatoryProps) {
  const { ComponentContainer, childProps, flexProps } = extractProps(props);
  return (
    <ComponentContainer flexProps={flexProps}>
      <Text {...childProps} />)
    </ComponentContainer>
  );
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
