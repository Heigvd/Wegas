import * as React from 'react';
import {
  registerComponent,
  pageComponentFactory,
  extractProps,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { store } from '../../../data/store';
import { Actions } from '../../../data';
import { Toggler } from '../../Inputs/Boolean/Toggler';
import { useComponentScript } from '../../Hooks/useComponentScript';
import { PageComponentMandatoryProps } from '../tools/EditableComponent';
import { CheckBox } from '../../Inputs/Boolean/CheckBox';

interface PlayerBooleanProps extends PageComponentMandatoryProps {
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

function PlayerBoolean(
  props: PlayerBooleanProps & PageComponentMandatoryProps,
) {
  const { ComponentContainer, childProps, flexProps } = extractProps(props);
  const { content, instance, notFound } = useComponentScript<
    IBooleanDescriptor
  >(childProps.script);

  const BooleanComponent = childProps.type === 'toggler' ? Toggler : CheckBox;

  return (
    <ComponentContainer flexProps={flexProps}>
      {notFound ? (
        <pre>Not found: {content}</pre>
      ) : (
        <BooleanComponent
          label={childProps.label}
          value={instance!.value}
          disabled={childProps.disabled}
          readOnly={childProps.inactive}
          onChange={v => {
            store.dispatch(
              Actions.VariableInstanceActions.runScript(
                `${content}.setValue(self, ${v});`,
              ),
            );
          }}
        />
      )}
    </ComponentContainer>
  );
}

registerComponent(
  pageComponentFactory(
    PlayerBoolean,
    'Boolean',
    'check-square',
    {
      script: schemaProps.scriptVariable('Variable', true, [
        'BooleanDescriptor',
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
