import * as React from 'react';
import { IScript, STextDescriptor } from 'wegas-ts-api';
import { runScript } from '../../../data/Reducer/VariableInstanceReducer';
import { Player } from '../../../data/selectors';
import { editingStore } from '../../../data/Stores/editingStore';
import { useStore } from '../../../data/Stores/store';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { useDebouncedOnChange } from '../../Hooks/useDebounce';
import { useScript } from '../../Hooks/useScript';
// import HTMLEditor from '../../HTML/HTMLEditor';
import HTMLEditorMk2 from '../../HTML/HTMLEditorMk2';
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
import { classStyleIdShema } from '../tools/options';
import { schemaProps } from '../tools/schemaProps';
import {
  OnVariableChange,
  onVariableChangeSchema,
  useOnVariableChange,
} from './tools';

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
  pageId,
  path,
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
        editingStore.dispatch(
          runScript(
            `Variable.find(gameModel,"${text.getName()}").setValue(self, '${v}');`,
          ),
        );
      }
    },
    [handleOnChange, text],
  );

  const {currentValue, debouncedOnChange } = useDebouncedOnChange(value, onChange, 400);

  return text == null ? (
    <UncompleteCompMessage pageId={pageId} path={path} />
  ) : validator ? (
    <Validate value={value} onValidate={onChange} onCancel={handleOnCancel}>
      {(value, onChange) => {
        return (
          <HTMLEditorMk2
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
    <HTMLEditorMk2
      id={id}
      value={String(currentValue)}
      onChange={debouncedOnChange}
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
