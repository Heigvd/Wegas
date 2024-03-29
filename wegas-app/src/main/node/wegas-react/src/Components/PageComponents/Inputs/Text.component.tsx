import * as React from 'react';
import { IScript, STextDescriptor } from 'wegas-ts-api';
import { runScript } from '../../../data/Reducer/VariableInstanceReducer';
import { Player } from '../../../data/selectors';
import { editingStore } from '../../../data/Stores/editingStore';
import { useStore } from '../../../data/Stores/store';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { commonTranslations } from '../../../i18n/common/common';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { useDebouncedOnChange } from '../../Hooks/useDebounce';
import { useScript } from '../../Hooks/useScript';
import HTMLEditor from '../../HTML/HTMLEditor';
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
  const { somethingIsUndefined } = useInternalTranslate(commonTranslations);
  const text = useScript<STextDescriptor | string>(script, context);
  const placeholderText = useScript<string>(placeholder, context);

  const value =
    useStore(() =>
      typeof text === 'object' ? text.getValue(Player.self()) : text,
    ) || '';

  const { handleOnChange } = useOnVariableChange(onVariableChange, context);
  const { handleOnCancel } = useOnCancelAction(onCancel, context);

  const textRef = React.useRef(text);

  React.useEffect(() => {
    textRef.current = text;
  }, [text]);

  const onChange = React.useCallback(
    (v: React.ReactText) => {
      if (handleOnChange) {
        handleOnChange(v);
      } else if (typeof textRef.current === 'object') {
        editingStore.dispatch(
          runScript(
            `Variable.find(gameModel,"${textRef.current.getName()}").setValue(self, ${JSON.stringify(
              v,
            )});`,
          ),
        );
      }
    },
    [handleOnChange, textRef],
  );

  const { currentValue, debouncedOnChange } = useDebouncedOnChange(
    value,
    onChange,
    400,
  );

  return text == null ? (
    <UncompleteCompMessage
      message={somethingIsUndefined('Text')}
      pageId={pageId}
      path={path}
    />
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
            toolbarLayout="full"
          />
        );
      }}
    </Validate>
  ) : (
    <HTMLEditor
      id={id}
      value={String(currentValue)}
      onChange={debouncedOnChange}
      disabled={options.disabled || options.locked}
      readOnly={options.readOnly}
      placeholder={placeholderText}
      className={className}
      style={style}
      toolbarLayout="full"
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerTextInput,
    componentType: 'Input',
    id: 'Text input',
    name: 'Text',
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
      ...classStyleIdSchema,
    },
    allowedVariables: ['StringDescriptor', 'TextDescriptor'],
    getComputedPropsFromVariable: v => ({
      script: createFindVariableScript(v),
    }),
  }),
);
