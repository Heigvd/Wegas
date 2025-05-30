import React from 'react';
import { SNumberDescriptor } from 'wegas-ts-api';
import { Actions } from '../../../data';
import { entityIs } from '../../../data/entities';
import { Player } from '../../../data/selectors';
import { editingStore } from '../../../data/Stores/editingStore';
import { useStore } from '../../../data/Stores/store';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { commonTranslations } from '../../../i18n/common/common';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { useScript } from '../../Hooks/useScript';
import { NumberInput } from '../../Inputs/Number/NumberInput';
import { validatorSchema } from '../../Inputs/Validate';
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

interface PlayerNumberInputProps extends WegasComponentProps {
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

function PlayerNumberInput({
  script,
  context,
  className,
  style,
  id,
  placeholder,
  onVariableChange,
  options,
  pageId,
  path,
}: PlayerNumberInputProps) {
  const { somethingIsUndefined } = useInternalTranslate(commonTranslations);
  const { readOnly, disabled, locked } = options;

  const number = useScript<SNumberDescriptor | number>(script, context);
  const placeholderText = useScript<string>(placeholder, context);

  const value = useStore(() =>
    typeof number === 'object' ? number.getValue(Player.self()) : number,
  );

  const { handleOnChange } = useOnVariableChange(onVariableChange, context);

  const onChange = React.useCallback(
    (newValue: number) => {
      if (handleOnChange) {
        handleOnChange(newValue);
      } else if (entityIs(number, 'NumberDescriptor')) {
        editingStore.dispatch(
          Actions.VariableInstanceActions.runScript(
            `Variable.find(gameModel,"${(
              number as SNumberDescriptor
            ).getName()}").setValue(self, ${newValue});`,
          ),
        );
      }
    },
    [handleOnChange, number],
  );

  return number == null ? (
    <UncompleteCompMessage
      message={somethingIsUndefined('Number')}
      pageId={pageId}
      path={path}
    />
  ) : (
    <NumberInput
      value={value}
      min={
        entityIs(number, 'NumberDescriptor')
          ? (number as SNumberDescriptor).getMinValue() ?? undefined
          : undefined
      }
      max={
        entityIs(number, 'NumberDescriptor')
          ? (number as SNumberDescriptor).getMaxValue() ?? undefined
          : undefined
      }
      className={className}
      style={style}
      id={id}
      readOnly={readOnly}
      disabled={disabled || locked}
      onChange={onChange}
      placeholder={placeholderText}
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerNumberInput,
    componentType: 'Input',
    id: 'Number input',
    name: 'Number',
    icon: 'sort-numeric-down',
    illustration: 'number',
    schema: {
      script: schemaProps.scriptVariable({
        label: 'Variable',
        required: true,
        returnType: ['SNumberDescriptor', 'number'],
      }),
      placeholder: schemaProps.scriptString({
        label: 'Placeholder',
        richText: false,
      }),
      onVariableChange: onVariableChangeSchema('On change action'),
      ...validatorSchema,
      ...classStyleIdSchema,
    },
    allowedVariables: ['NumberDescriptor'],
    getComputedPropsFromVariable: v => ({
      script: createFindVariableScript(v),
    }),
  }),
);
