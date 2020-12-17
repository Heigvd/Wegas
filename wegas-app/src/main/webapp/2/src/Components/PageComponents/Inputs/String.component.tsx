import * as React from 'react';
import {
  registerComponent,
  pageComponentFactory,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { store } from '../../../data/store';
import { WegasComponentProps } from '../tools/EditableComponent';
import { IScript, SStringDescriptor } from 'wegas-ts-api';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { SimpleInput } from '../../Inputs/SimpleInput';
import { safeClientScriptEval, useScript } from '../../Hooks/useScript';
import { classStyleIdShema } from '../tools/options';
import { runScript } from '../../../data/Reducer/VariableInstanceReducer';
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
  const player = useCurrentPlayer();

  const { handleOnChange } = useOnVariableChange(onVariableChange, context);

  const { disabled, readOnly } = options;

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
  ) : // <pre className={className} style={style} id={id}>
  //   Not found: {script?.content}
  // </pre>
  validator ? (
    <Validate
      value={typeof text === 'object' ? text.getValue(player) : text}
      onValidate={onChange}
      onCancel={() => safeClientScriptEval(onCancel, context)}
    >
      {(value, onChange) => {
        return (
          <SimpleInput
            value={value}
            onChange={onChange}
            disabled={disabled}
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
      value={typeof text === 'object' ? text.getValue(player) : text}
      onChange={onChange}
      disabled={disabled}
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
