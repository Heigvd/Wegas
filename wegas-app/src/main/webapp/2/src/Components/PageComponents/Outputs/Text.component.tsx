import * as React from 'react';
import { Text } from '../../Outputs/Text';
import {
  registerComponent,
  pageComponentFactory,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { WegasFunctionnalComponentProps } from '../tools/EditableComponent';
import { useComponentScript } from '../../Hooks/useComponentScript';
import { IScript, ITextDescriptor } from 'wegas-ts-api/typings/WegasEntities';

export interface PlayerTextProps extends WegasFunctionnalComponentProps {
  script?: IScript;
}

function PlayerText({ script, className, style }: PlayerTextProps) {
  const { content, instance } = useComponentScript<ITextDescriptor>(script);
  return instance == null || instance.trValue == null ? (
    <span>Not found: {content}</span>
  ) : (
    <Text
      style={{ margin: 'auto', ...style }}
      className={className}
      htmlTranslatableContent={instance.trValue}
    />
  );
}

registerComponent(
  pageComponentFactory(
    PlayerText,
    'Output',
    'Text',
    'paragraph',
    {
      script: schemaProps.scriptVariable('Variable', true, [
        'STextDescriptor',
      ]),
      className: schemaProps.string('ClassName', false),
    },
    ['STextDescriptor'],
    () => ({}),
  ),
);
