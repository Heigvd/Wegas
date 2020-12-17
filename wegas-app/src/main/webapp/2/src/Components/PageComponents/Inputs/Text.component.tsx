import * as React from 'react';
import {
  registerComponent,
  pageComponentFactory,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { store } from '../../../data/store';
import { WegasComponentProps } from '../tools/EditableComponent';
import { IScript, STextDescriptor } from 'wegas-ts-api';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { safeClientScriptEval, useScript } from '../../Hooks/useScript';
import { classStyleIdShema } from '../tools/options';
import { runScript } from '../../../data/Reducer/VariableInstanceReducer';
import HTMLEditor from '../../HTMLEditor';
import {
  OnVariableChange,
  onVariableChangeSchema,
  useOnVariableChange,
} from './tools';
import { useCurrentPlayer } from '../../../data/selectors/Player';
import {
  Validate,
  ValidatorComponentProps,
  validatorSchema,
} from '../../Inputs/Validate';
import { TumbleLoader } from '../../Loader';

interface PlayerTextInputProps
  extends WegasComponentProps,
    ValidatorComponentProps {
  /**
   * script - the script that returns the variable to display and modify
   */
  script?: IScript;
  /**
   * placeholder - the grey text inside the box when nothing is written
   */
  placeholder?: IScript;
  onVariableChange?: OnVariableChange;
}

function PlayerTextInput({
  // placeholder,
  context,
  script,
  // options,
  className,
  style,
  id,
  onVariableChange,
  validator,
  onCancel,
}: PlayerTextInputProps) {
  const text = useScript<STextDescriptor | string>(script, context);
  const player = useCurrentPlayer();
  const { handleOnChange } = useOnVariableChange(onVariableChange, context);

  const onChange = React.useCallback(
    (v: React.ReactText) => {
      if (handleOnChange) {
        handleOnChange(v);
      } else if (typeof text === 'object') {
        store.dispatch(
          runScript(
            `Variable.find(gameModel,"${text.getName()}").setValue(self, '${v}');`,
          ),
        );
      }
    },
    [handleOnChange, text],
  );

  return text == null ? (
    <TumbleLoader />
  ) : validator ? (
    <Validate
      value={typeof text === 'object' ? text.getValue(player) : text}
      onValidate={onChange}
      onCancel={() => safeClientScriptEval(onCancel, context)}
    >
      {(value, onChange) => {
        return (
          <HTMLEditor
            id={id}
            value={String(value)}
            onChange={onChange}
            // disabled={disabled}
            // readOnly={readOnly}
            // placeholder={placeholderText}
            className={className}
            style={style}
          />
        );
      }}
    </Validate>
  ) : (
    <HTMLEditor
      id={id}
      value={typeof text === 'object' ? text.getValue(player) : text}
      onChange={onChange}
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
        returnType: ['STextDescriptor', 'string'],
      }),
      placeholder: schemaProps.scriptString({
        label: 'Placeholder',
        richText: true,
      }),
      onVariableChange: onVariableChangeSchema('On text change action'),
      ...validatorSchema,
      ...classStyleIdShema,
    },
    allowedVariables: ['StringDescriptor', 'TextDescriptor'],
    getComputedPropsFromVariable: v => ({
      script: createFindVariableScript(v),
    }),
  }),
);
