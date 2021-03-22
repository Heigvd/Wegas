import * as React from 'react';
import {
  registerComponent,
  pageComponentFactory,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { store, useStore } from '../../../data/Stores/store';
import { WegasComponentProps } from '../tools/EditableComponent';
import { IScript, SStringDescriptor } from 'wegas-ts-api';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { SimpleInput } from '../../Inputs/SimpleInput';
import { useScript } from '../../Hooks/useScript';
import { classStyleIdShema } from '../tools/options';
import { runScript } from '../../../data/Reducer/VariableInstanceReducer';
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

interface PlayerStringInput
  extends WegasComponentProps,
    ValidatorComponentProps {
  onVariableChange?: OnVariableChange;
  /**
   * script - the script that returns the variable to display and modify
   */
  script?: IScript;
  /**
   * placeholder - the grey text inside the box when nothing is written
   */
  placeholder?: IScript;
}

function PlayerStringInput({
  placeholder,
  context,
  script,
  options,
  className,
  style,
  id,
  onVariableChange,
  validator,
  onCancel,
}: PlayerStringInput) {
  const placeholderText = useScript<string>(placeholder, context);

  const text = useScript<SStringDescriptor | string>(script, context);

  const value = useStore(
    () =>
      (typeof text === 'object' ? text.getValue(Player.self()) : text) || '',
  );

  const { handleOnChange } = useOnVariableChange(onVariableChange, context);
  const { handleOnCancel } = useOnCancelAction(onCancel, context);

  const { disabled, readOnly, locked } = options;

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
          <SimpleInput
            value={value}
            onChange={onChange}
            disabled={disabled || locked}
            readOnly={readOnly}
            placeholder={placeholderText}
            className={className}
            style={style}
            id={id}
          />
        );
      }}
    </Validate>
  ) : (
    <SimpleInput
      value={value}
      onChange={onChange}
      disabled={disabled || locked}
      readOnly={readOnly}
      placeholder={placeholderText}
      className={className}
      style={style}
      id={id}
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerStringInput,
    componentType: 'Input',
    name: 'String input',
    icon: 'paragraph',
    schema: {
      script: schemaProps.scriptVariable({
        label: 'Variable',
        required: true,
        returnType: ['SStringDescriptor', 'string'],
      }),
      placeholder: schemaProps.scriptString({
        label: 'Placeholder',
        richText: true,
      }),
      onVariableChange: onVariableChangeSchema('On text change action'),
      ...validatorSchema,
      ...classStyleIdShema,
    },
    allowedVariables: ['StringDescriptor'],
    getComputedPropsFromVariable: v => ({
      script: createFindVariableScript(v),
    }),
  }),
);
