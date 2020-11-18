import * as React from 'react';
import {
  registerComponent,
  pageComponentFactory,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { store, useStore } from '../../../data/store';
import { WegasComponentProps } from '../tools/EditableComponent';
import { IScript, STextDescriptor } from 'wegas-ts-api';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { useScript } from '../../Hooks/useScript';
import { classStyleIdShema } from '../tools/options';
import { runScript } from '../../../data/Reducer/VariableInstanceReducer';
import HTMLEditor from '../../HTMLEditor';
import { instantiate } from '../../../data/scriptable';
import { Player } from '../../../data/selectors';

interface PlayerTextInputProps extends WegasComponentProps {
  /**
   * script - the script that returns the variable to display and modify
   */
  script?: IScript;
  /**
   * placeholder - the grey text inside the box when nothing is written
   */
  placeholder?: IScript;
}

function PlayerTextInput({
  // placeholder,
  context,
  script,
  // options,
  className,
  style,
  id,
}: PlayerTextInputProps) {
  const text = useScript<STextDescriptor>(script, context);
  const player = instantiate(useStore(Player.selectCurrent));

  return text == null ? (
    <pre className={className} style={style} id={id}>
      Not found: {script?.content}
    </pre>
  ) : (
    <HTMLEditor
      id={id}
      value={text.getValue(player)}
      onChange={v => {
        store.dispatch(
          runScript(
            `Variable.find(gameModel,"${text.getName()}").setValue(self, '${v}');`,
          ),
        );
      }}
      // disabled={disabled}
      // readOnly={readOnly}
      // placeholder={placeholderText}
      className={className}
      style={style}
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerTextInput,
    componentType: 'Input',
    name: 'Text input',
    icon: 'paragraph',
    schema: {
      script: schemaProps.scriptVariable({
        label: 'Variable',
        required: true,
        returnType: ['STextDescriptor'],
      }),
      placeholder: schemaProps.scriptString({ label: 'Placeholder' }),
      ...classStyleIdShema,
    },
    allowedVariables: ['StringDescriptor', 'TextDescriptor'],
    getComputedPropsFromVariable: v => ({
      script: createFindVariableScript(v),
    }),
  }),
);
