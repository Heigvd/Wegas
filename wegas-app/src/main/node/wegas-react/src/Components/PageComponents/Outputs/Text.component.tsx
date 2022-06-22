import * as React from 'react';
import { IScript } from 'wegas-ts-api';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import {
  ScriptCallback,
  useScript,
  useScriptCallback,
  useUpdatedContextRef,
} from '../../Hooks/useScript';
import { HTMLText } from '../../Outputs/HTMLText';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { classStyleIdShema } from '../tools/options';
import { schemaProps } from '../tools/schemaProps';

export interface PlayerTextProps extends WegasComponentProps {
  text?: IScript;
  onPointerOver?: ScriptCallback;
}

function PlayerText({
  text,
  onPointerOver,
  context,
  className,
  style,
  id,
  options,
}: PlayerTextProps) {
  const content = useScript<string>(text, context);
  const contextRef = useUpdatedContextRef(context);
  const onPointerOverCb = useScriptCallback(onPointerOver, contextRef);
  return !text ? (
    <span id={id} className={className} style={style}>
      No text
    </span>
  ) : (
    <HTMLText
      id={id}
      onPointerOver={onPointerOverCb}
      text={content}
      style={style}
      className={className}
      disabled={options.disabled || options.locked}
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerText,
    componentType: 'Output',
    id: 'Text',
    name: 'Text',
    icon: 'paragraph',
    illustration: 'text',
    schema: {
      text: schemaProps.scriptString({ label: 'Text', richText: true }),
      onPointerOver: {
        view: {
          type: 'undefinedable',
          label: 'on over',
          schema: {
            view: {
              type: 'callback',
              callbackProps: {
                returnType: ['void'],
                args: [],
              },
            },
          },
        },
      },
      ...classStyleIdShema,
    },
    allowedVariables: ['TextDescriptor'],
    getComputedPropsFromVariable: v => ({
      text: createFindVariableScript(v),
    }),
  }),
);
