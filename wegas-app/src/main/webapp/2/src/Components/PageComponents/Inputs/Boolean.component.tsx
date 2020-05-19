import * as React from 'react';
import {
  registerComponent,
  pageComponentFactory,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { store } from '../../../data/store';
import { Actions } from '../../../data';
import { Toggler } from '../../Inputs/Boolean/Toggler';
import { useComponentScript } from '../../Hooks/useComponentScript';
import { CheckBox } from '../../Inputs/Boolean/CheckBox';
import { WegasComponentProps } from '../tools/EditableComponent';

interface PlayerBooleanProps extends WegasComponentProps {
  /**
   * script - the script that returns the variable to display and modify
   */
  script?: IScript;
  /**
   * label - The label to display with the component
   */
  label?: string;
  /**
   * type - the behaviour and style of the component
   */
  type?: 'checkbox' | 'toggler';
  /**
   * inactive - if true, the component will only display the boolean but the user won't be abe to change it
   */
  inactive?: boolean;
  /**
   * disabled - if true, the component will be disabled
   */
  disabled?: boolean;
}

function PlayerBoolean({
  script,
  type,
  label,
  disabled,
  inactive,
}: PlayerBooleanProps) {
  const { content, instance, notFound } = useComponentScript<
    IBooleanDescriptor
  >(script);

  const BooleanComponent = type === 'toggler' ? Toggler : CheckBox;

  return notFound ? (
    <pre>Not found: {content}</pre>
  ) : (
    <BooleanComponent
      label={label}
      value={instance!.value}
      disabled={disabled}
      readOnly={inactive}
      onChange={v => {
        store.dispatch(
          Actions.VariableInstanceActions.runScript(
            `${content}.setValue(self, ${v});`,
          ),
        );
      }}
    />
  );
}

registerComponent(
  pageComponentFactory(
    PlayerBoolean,
    'Boolean',
    'check-square',
    {
      script: schemaProps.scriptVariable('Variable', true, [
        'ISBooleanDescriptor',
      ]),
      label: schemaProps.string('Label', false),
      type: schemaProps.select('Type', false, ['checkbox', 'toggler']),
      disabled: schemaProps.boolean('Disabled', false),
      inactive: schemaProps.boolean('Inactive', false),
    },
    ['ISBooleanDescriptor'],
    () => ({}),
  ),
);
