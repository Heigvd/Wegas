import * as React from 'react';
import {
  registerComponent,
  pageComponentFactory,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { store, useStore } from '../../../data/Stores/store';
import { WegasComponentProps } from '../tools/EditableComponent';
import { IScript, STextDescriptor } from 'wegas-ts-api';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { useScript } from '../../Hooks/useScript';
import { classStyleIdShema } from '../tools/options';
import { runScript } from '../../../data/Reducer/VariableInstanceReducer';
import HTMLEditor from '../../HTML/HTMLEditor';
import {
  OnVariableChange,
  onVariableChangeSchema,
  useOnVariableChange,
} from './tools';
import {
  useOnCancelAction,
  Validate,
  ValidatorComponentProps,
  validatorSchema,
} from '../../Inputs/Validate';
import { TumbleLoader } from '../../Loader';
import { Player } from '../../../data/selectors';

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
  placeholder,
  context,
  script,
  className,
  style,
  id,
  onVariableChange,
  validator,
  onCancel,
  options,
}: PlayerTextInputProps) {
  const text = useScript<STextDescriptor | string>(script, context);
  const placeholderText = useScript<string>(placeholder, context);

  const value =
    useStore(() =>
      typeof text === 'object' ? text.getValue(Player.self()) : text,
    ) || '';

  const { handleOnChange } = useOnVariableChange(onVariableChange, context);
  const { handleOnCancel } = useOnCancelAction(onCancel, context);

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
    <Validate value={value} onValidate={onChange} onCancel={handleOnCancel}>
      {(value, onChange) => {
        return (
          <HTMLEditor
            id={id}
            value={String(value)}
            onChange={onChange}
            disabled={options.disabled || options.locked}
            readOnly={options.readOnly}
            placeholder={placeholderText}
            className={className}
            style={style}
          />
        );
      }}
    </Validate>
  ) : (
    <HTMLEditor
      id={id}
      value={value}
      onChange={onChange}
      disabled={options.disabled || options.locked}
      readOnly={options.readOnly}
      placeholder={placeholderText}
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
    illustration: 'textInput',
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