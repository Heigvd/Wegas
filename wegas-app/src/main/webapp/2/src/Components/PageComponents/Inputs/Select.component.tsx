import * as React from 'react';
import {
  registerComponent,
  pageComponentFactory,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { store, useStore } from '../../../data/Stores/store';
import { WegasComponentProps } from '../tools/EditableComponent';
import { IScript, SNumberDescriptor, SStringDescriptor } from 'wegas-ts-api';
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
import { TumbleLoader } from '../../Loader';
import { useScript } from '../../Hooks/useScript';
import { wwarn } from '../../../Helper/wegaslog';
import { Player } from '../../../data/selectors';

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
  const descriptor = useScript<SStringDescriptor | SNumberDescriptor | string>(
    script,
    context,
  );

  const value = useStore(
    () =>
      (descriptor != null && typeof descriptor === 'object'
        ? descriptor.getValue(Player.self())
        : descriptor) || '',
  );

  const { lang } = React.useContext(languagesCTX);
  const { handleOnChange } = useOnVariableChange(onVariableChange, context);

  if (descriptor == null) {
    wwarn('Varialbe not found');
    return <TumbleLoader />;
  }

  const computedChoices: Choice[] =
    choices == null || choices.length === 0
      ? entityIs(descriptor, 'StringDescriptor')
        ? (descriptor as SStringDescriptor).getAllowedValues().map(v => {
            const value = translate(v.getLabel(), lang);
            return { value, label: v.getName() || value };
          })
        : []
      : choices;

  return (
    <Selector
      id={id}
      value={String(value)}
      choices={computedChoices}
      onChange={v => {
        const newValue = v.target.value;
        if (handleOnChange) {
          handleOnChange(newValue);
        } else if (typeof descriptor === 'object') {
          store.dispatch(
            runScript(
              `Variable.find(gameModel,"${descriptor.getName()}").setValue(self, ${
                entityIs(descriptor, 'NumberDescriptor')
                  ? Number(newValue)
                  : `'${newValue}'`
              });`,
            ),
          );
        } else {
          wwarn(
            'You need to define an action when the given value is not a descriptor!',
          );
        }
      }}
      className={className}
      style={style}
      disabled={options.disabled || options.locked}
      readOnly={options.readOnly}
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerSelectInput,
    componentType: 'Input',
    name: 'Select input',
    icon: 'list-ul',
    illustration: 'selectInput',
    schema: {
      script: schemaProps.scriptVariable({
        label: 'Variable',
        required: true,
        returnType: ['SStringDescriptor', 'SNumberDescriptor', 'string'],
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
    allowedVariables: ['StringDescriptor', 'NumberDescriptor'],
    getComputedPropsFromVariable: v => ({
      script: createFindVariableScript(v),
    }),
  }),
);
