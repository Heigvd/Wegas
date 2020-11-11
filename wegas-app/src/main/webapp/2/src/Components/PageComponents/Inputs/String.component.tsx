import * as React from 'react';
import {
  registerComponent,
  pageComponentFactory,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { store } from '../../../data/store';
import { Actions } from '../../../data';
import { useComponentScript } from '../../Hooks/useComponentScript';
import { WegasComponentProps } from '../tools/EditableComponent';
import { IScript, IStringDescriptor } from 'wegas-ts-api';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { SimpleInput } from '../../Inputs/SimpleInput';
import { useScript } from '../../Hooks/useScript';
import { useTranslate } from '../../../Editor/Components/FormView/translatable';
import { classAndStyleShema } from '../tools/options';

interface PlayerStringInput extends WegasComponentProps {
  /**
   * script - the script that returns the variable to display and modify
   */
  script?: IScript;
  /**
   * placeholder - the grey text inside the box when nothing is written
   */
  placeholder?: IScript;
}

function PlayerStringInput(props: PlayerStringInput) {
  const placeholder = useScript<string>(props.placeholder);
  const { content, instance, notFound } = useComponentScript<IStringDescriptor>(
    props.script,
  );

  const disabled = useScript<boolean>(props.disableIf);
  const readOnly = useScript<boolean>(props.readOnlyIf);
  const value = useTranslate(instance?.trValue);

  return notFound ? (
    <pre>Not found: {content}</pre>
  ) : (
    <SimpleInput
      value={value}
      onChange={v => {
        store.dispatch(
          Actions.VariableInstanceActions.runScript(
            `${content}.setValue(self, ${v});`,
          ),
        );
      }}
      disabled={disabled}
      readOnly={readOnly}
      placeholder={placeholder}
      className={props.className}
      style={props.style}
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerStringInput,
    componentType: 'Input',
    name: 'String',
    icon: 'paragraph',
    schema: {
      script: schemaProps.scriptVariable({
        label: 'Variable',
        required: true,
        returnType: ['SStringDescriptor'],
      }),
      placeholder: schemaProps.scriptString({ label: 'Placeholder' }),
      ...classAndStyleShema,
    },
    allowedVariables: ['StringDescriptor'],
    getComputedPropsFromVariable: v => ({
      script: createFindVariableScript(v),
    }),
  }),
);
