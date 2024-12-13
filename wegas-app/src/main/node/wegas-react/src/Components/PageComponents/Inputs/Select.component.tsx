import * as React from 'react';
import { IScript, SNumberDescriptor, SStringDescriptor } from 'wegas-ts-api';
import { entityIs } from '../../../data/entities';
import { translate } from '../../../data/i18n';
import { runScript } from '../../../data/Reducer/VariableInstanceReducer';
import { Player } from '../../../data/selectors';
import { editingStore } from '../../../data/Stores/editingStore';
import { useStore } from '../../../data/Stores/store';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { wwarn } from '../../../Helper/wegaslog';
import { commonTranslations } from '../../../i18n/common/common';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { languagesCTX } from '../../Contexts/LanguagesProvider';
import { useScript } from '../../Hooks/useScript';
import { Choice, Selector } from '../../Selector';
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

interface PlayerSelectInputProps extends WegasComponentProps {
  /**
   * script - the script that returns the variable to display and modify
   */
  script?: IScript;
  /**
   * choices - the allowed choices
   */
  choices?: Choice[] | IScript;
  /**
   * placeholder - the grey text inside the box when nothing is selected
   */
  placeholder?: IScript;
  /**
   * noOptionsMessage - the text to inform that there is no available choice
   */
  noOptionsMessage?: IScript;
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
  pageId,
  path,
  placeholder,
  noOptionsMessage,
}: PlayerSelectInputProps) {
  const { somethingIsUndefined } = useInternalTranslate(commonTranslations);
  const descriptor = useScript<SStringDescriptor | SNumberDescriptor | string>(
    script,
    context,
  );

  const scriptedChoices = useScript<Choice[] | undefined>(
    entityIs(choices, 'Script') ? choices : '[]',
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
  const placeholderText = useScript<string>(placeholder, context);
  const noOptionsMessageText = useScript<string>(noOptionsMessage, context);

  if (descriptor == null) {
    return (
      <UncompleteCompMessage
        message={somethingIsUndefined('String/Number')}
        pageId={pageId}
        path={path}
      />
    );
  }
  const choicesFromProp = entityIs(choices, 'Script')
    ? scriptedChoices
    : choices;

  const computedChoices: Choice[] =
    choicesFromProp == null || choicesFromProp.length === 0
      ? entityIs(descriptor, 'StringDescriptor')
        ? (descriptor as SStringDescriptor)
            .getAllowedValues()
            .map(allowedValue => {
              const label = translate(allowedValue.getLabel(), lang);
              const value = allowedValue.getName();
              return {
                value: value,
                label: label || value,
              };
            })
        : []
      : choicesFromProp;

  return (
    <Selector
      id={id}
      value={String(value)}
      choices={computedChoices}
      placeholder={placeholderText}
      noOptionsMessage={noOptionsMessageText}
      onChange={v => {
        const newValue = v;
        if (handleOnChange) {
          handleOnChange(newValue);
        } else if (typeof descriptor === 'object') {
          editingStore.dispatch(
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
    id: 'Select input',
    name: 'Select',
    icon: 'list-ul',
    illustration: 'selectInput',
    schema: {
      script: schemaProps.scriptVariable({
        label: 'Variable',
        required: true,
        returnType: ['SStringDescriptor', 'SNumberDescriptor', 'string'],
      }),
      choices: {
        view: {
          type: 'scriptable',
          label: 'Choices',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['{label:string, value: string}[]'],
          },
          literalSchema: schemaProps.array({
            itemSchema: {
              label: schemaProps.string({ label: 'Label' }),
              value: schemaProps.string({ label: 'Value' }),
            },
          }),
        },
      },
      placeholder: schemaProps.scriptString({
        label: 'Placeholder',
        richText: false,
      }),
      noOptionsMessage: schemaProps.scriptString({
        label: 'No options message',
        richText: false,
      }),
      onVariableChange: onVariableChangeSchema('On text change action'),
      ...classStyleIdSchema,
    },
    allowedVariables: ['StringDescriptor', 'NumberDescriptor'],
    getComputedPropsFromVariable: v => ({
      script: createFindVariableScript(v),
    }),
  }),
);
