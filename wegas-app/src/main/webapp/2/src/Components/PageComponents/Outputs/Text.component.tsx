import * as React from 'react';
import { Text } from '../../Outputs/Text';
import {
  registerComponent,
  pageComponentFactory,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { WegasComponentProps } from '../tools/EditableComponent';
import { IScript } from 'wegas-ts-api';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { useScript } from '../../Hooks/useScript';

export interface PlayerTextProps extends WegasComponentProps {
  text?: IScript;
}

function PlayerText({ text, className, style }: PlayerTextProps) {
  const content = useScript<string>(text);
  return !text ? (
    <span>No text</span>
  ) : (
    <Text style={style} className={className} text={content} />
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerText,
    componentType: 'Output',
    name: 'Text',
    icon: 'paragraph',
    schema: {
      text: schemaProps.scriptString({ label: 'Text' }),
      className: schemaProps.string({ label: 'ClassName' }),
    },
    allowedVariables: ['TextDescriptor'],
    getComputedPropsFromVariable: v => ({
      text: createFindVariableScript(v),
    }),
  }),
);
