import * as React from 'react';
import { IScript, SStringDescriptor } from 'wegas-ts-api';
import { runScript } from '../../../data/Reducer/VariableInstanceReducer';
import { Player } from '../../../data/selectors';
import { editingStore } from '../../../data/Stores/editingStore';
import { useStore } from '../../../data/Stores/store';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { commonTranslations } from '../../../i18n/common/common';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { useScript } from '../../Hooks/useScript';
import { SimpleInput } from '../../Inputs/SimpleInput';
import {
  useOnCancelAction,
  Validate,
  ValidatorComponentProps,
  validatorSchema,
} from '../../Inputs/Validate';
import { UncompleteCompMessage } from '../../UncompleteCompMessage';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { classStyleIdSchema } from '../tools/options';
import { schemaProps } from '../tools/schemaProps';
import {
  OnVariableChange,
  onVariableChangeSchema,
  useOnVariableChange,
} from './tools';

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
  /**
   * Rows: multiline input
   */
  rows?: number;
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
  pageId,
  path,
  rows,
}: PlayerStringInput) {
  const { somethingIsUndefined } = useInternalTranslate(commonTranslations);

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
    (newValue: React.ReactText) => {
      if (handleOnChange) {
        handleOnChange(newValue);
      } else if (typeof text === 'object') {
        editingStore.dispatch(
          runScript(
            `Variable.find(gameModel,"${text.getName()}").setValue(self, ${JSON.stringify(
              newValue,
            )});`,
          ),
        );
      }
    },
    [handleOnChange, text],
  );

  return text == null ? (
    <UncompleteCompMessage
      message={somethingIsUndefined('String')}
      pageId={pageId}
      path={path}
    />
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
            rows={rows}
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
      rows={rows}
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerStringInput,
    componentType: 'Input',
    id: 'String input',
    name: 'String',
    icon: 'paragraph',
    illustration: 'stringInput',
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
      rows: {
        type: ['number', 'null'],
        view: {
          label: 'multiline',
          type: 'number',
          placeholder: '1',
        },
      },
      ...validatorSchema,
      ...classStyleIdSchema,
    },
    allowedVariables: ['StringDescriptor'],
    getComputedPropsFromVariable: v => ({
      script: createFindVariableScript(v),
    }),
  }),
);
