import * as React from 'react';
import {
  registerComponent,
  pageComponentFactory,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { store, useStore } from '../../../data/store';
import { WegasComponentProps } from '../tools/EditableComponent';
import {
  IScript,
  SNumberDescriptor,
  SStringDescriptor,
  STextDescriptor,
} from 'wegas-ts-api';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { useScript } from '../../Hooks/useScript';
import { classStyleIdShema } from '../tools/options';
import { runScript } from '../../../data/Reducer/VariableInstanceReducer';
import { instantiate } from '../../../data/scriptable';
import { Player } from '../../../data/selectors';
import {
  OnVariableChange,
  onVariableChangeSchema,
  useOnVariableChange,
} from './tools';
import { Choice, Selector } from '../../../Editor/Components/FormView/Select';
import { entityIs } from '../../../data/entities';
import { translate } from '../../../Editor/Components/FormView/translatable';
import { languagesCTX } from '../../Contexts/LanguagesProvider';

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
  onVariableChange,
}: PlayerSelectInputProps) {
  const player = instantiate(useStore(Player.selectCurrent));
  const variable = useScript<
    SStringDescriptor | STextDescriptor | SNumberDescriptor
  >(script, context);
  const value = JSON.stringify(String(variable?.getValue(player)));
  const { lang } = React.useContext(languagesCTX);
  const { handleOnChange } = useOnVariableChange(onVariableChange, context);

  const computedChoices: Choice[] =
    choices == null
      ? entityIs(variable, 'StringDescriptor')
        ? variable.allowedValues.map(v => {
            const value = translate(v.label, lang);
            return { value, label: v.name || value };
          })
        : []
      : choices;

  return variable == null ? (
    <pre className={className} style={style} id={id}>
      Not found: {script?.content}
    </pre>
  ) : (
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
              `Variable.find(gameModel,"${variable.getName()}").setValue(self, ${
                entityIs(variable, 'NumberDescriptor')
                  ? Number(newValue)
                  : `'${newValue}'`
              });`,
            ),
          );
        }
      }}
      className={className}
      style={style}
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
