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
import { classStyleIdShema } from '../tools/options';

export interface PlayerTextProps extends WegasComponentProps {
  text?: IScript;
}

function PlayerText({
  text,
  context,
  className,
  style,
  id,
  options,
}: PlayerTextProps) {
  const content = useScript<string>(text, context);
  return !text ? (
    <span id={id} className={className} style={style}>
      No text
    </span>
  ) : (
    <Text
      id={id}
      text={content}
      style={style}
      disabled={options.disabled || options.locked}
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerText,
    componentType: 'Output',
    name: 'Text',
    icon: 'paragraph',
    schema: {
      text: schemaProps.scriptString({ label: 'Text', richText: true }),
      ...classStyleIdShema,
    },
    allowedVariables: ['TextDescriptor'],
    getComputedPropsFromVariable: v => ({
      text: createFindVariableScript(v),
    }),
  }),
);
