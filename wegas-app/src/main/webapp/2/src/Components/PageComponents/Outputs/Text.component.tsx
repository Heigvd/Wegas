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
import { classAndStyleShema } from '../tools/options';

export interface PlayerTextProps extends WegasComponentProps {
  text?: IScript;
}

function PlayerText({ text, context, className, style }: PlayerTextProps) {
  const content = useScript<string>(text, context);
  return !text ? (
    <span className={className} style={style}>
      No text
    </span>
  ) : (
    <Text text={content} className={className} style={style} />
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
      ...classAndStyleShema,
    },
    allowedVariables: ['TextDescriptor'],
    getComputedPropsFromVariable: v => ({
      text: createFindVariableScript(v),
    }),
  }),
);
