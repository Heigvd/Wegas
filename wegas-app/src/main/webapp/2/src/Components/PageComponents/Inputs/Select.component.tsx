import * as React from 'react';
import {
  registerComponent,
  pageComponentFactory,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { store } from '../../../data/Stores/store';
import { WegasComponentProps } from '../tools/EditableComponent';
import {
  INumberDescriptor,
  IScript,
  IStringDescriptor,
  ITextDescriptor,
} from 'wegas-ts-api';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { classStyleIdShema } from '../tools/options';
import { runScript } from '../../../data/Reducer/VariableInstanceReducer';
import {
  OnVariableChange,
  onVariableChangeSchema,
  useOnVariableChange,
} from './tools';
import { Choice, Selector } from '../../../Editor/Components/FormView/Select';
import { entityIs } from '../../../data/entities';
import { translate } from '../../../Editor/Components/FormView/translatable';
import { languagesCTX } from '../../Contexts/LanguagesProvider';
import { useComponentScript } from '../../Hooks/useComponentScript';
import { TumbleLoader } from '../../Loader';
import { cx } from 'emotion';
import { halfOpacity } from '../../../css/classes';

interface PlayerSelectInputProps extends WegasComponentProps {
  /**
   * script - the script that returns the variable to display and modify
   */
  script?: IScript;
  /**
   * choices - the allowed choices
   */
  choices?: Choice[];
  onVariableChange?: OnVariableChange;
}

function PlayerSelectInput({
  context,
  script,
  choices,
  className,
  style,
  id,
  options,
  onVariableChange,
}: PlayerSelectInputProps) {
  const { descriptor, instance } = useComponentScript<
    IStringDescriptor | ITextDescriptor | INumberDescriptor
  >(script, context);
  const { lang } = React.useContext(languagesCTX);
  const { handleOnChange } = useOnVariableChange(onVariableChange, context);

  if (instance == null || descriptor == null) {
    return <TumbleLoader />;
  }

  const value = JSON.stringify(
    String(
      'getValue' in instance ? instance.getValue() : instance.getTrValue(),
    ),
  );

  const computedChoices: Choice[] =
    choices == null
      ? entityIs(descriptor, 'StringDescriptor')
        ? descriptor.allowedValues.map(v => {
            const value = translate(v.label, lang);
            return { value, label: v.name || value };
          })
        : []
      : choices;

  return (
    <Selector
      id={id}
      value={value}
      choices={computedChoices}
      onChange={v => {
        const newValue = JSON.parse(v.target.value);
        if (handleOnChange) {
          handleOnChange(newValue);
        } else {
          store.dispatch(
            runScript(
              `Variable.find(gameModel,"${descriptor.getName()}").setValue(self, ${
                entityIs(descriptor, 'NumberDescriptor')
                  ? Number(newValue)
                  : `'${newValue}'`
              });`,
            ),
          );
        }
      }}
      className={cx(className, {
        [halfOpacity]: options.disabled || options.readOnly
      })}
      style={style}
      disabled = {options.disabled}
      readOnly = {options.readOnly}
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerSelectInput,
    componentType: 'Input',
    name: 'Select input',
    icon: 'list-ul',
    schema: {
      script: schemaProps.scriptVariable({
        label: 'Variable',
        required: true,
        returnType: [
          'SStringDescriptor',
          'STextDescriptor',
          'SNumberDescriptor',
        ],
      }),
      choices: schemaProps.array({
        label: 'Choices',
        itemSchema: {
          label: schemaProps.string({ label: 'Label' }),
          value: schemaProps.string({ label: 'Value' }),
        },
      }),
      onVariableChange: onVariableChangeSchema('On text change action'),
      ...classStyleIdShema,
    },
    allowedVariables: ['StringDescriptor', 'TextDescriptor'],
    getComputedPropsFromVariable: v => ({
      script: createFindVariableScript(v),
    }),
  }),
);
