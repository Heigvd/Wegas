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
import { IScript, IBooleanDescriptor } from 'wegas-ts-api';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { useScript } from '../../Hooks/useScript';

interface PlayerBooleanProps extends WegasComponentProps {
  /**
   * script - the script that returns the variable to display and modify
   */
  value?: IScript;
  /**
   * label - The label to display with the component
   */
  label?: IScript;
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
  value,
  type,
  label,
  disabled,
  inactive,
  context,
}: PlayerBooleanProps) {
  const {
    content: valueScript,
    instance: valueInstance,
    notFound: valueNotFound,
  } = useComponentScript<IBooleanDescriptor>(value);
  const strLabel = useScript<string>(label, context);

  const BooleanComponent = type === 'toggler' ? Toggler : CheckBox;

  return valueNotFound ? (
    <pre>Not found: {valueScript}</pre>
  ) : (
    <BooleanComponent
      label={strLabel}
      value={valueInstance!.value}
      disabled={disabled}
      readOnly={inactive}
      onChange={v => {
        store.dispatch(
          Actions.VariableInstanceActions.runScript(
            `${valueScript}.setValue(self, ${v});`,
          ),
        );
      }}
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerBoolean,
    componentType: 'Input',
    name: 'Boolean',
    icon: 'check-square',
    schema: {
      value: schemaProps.scriptVariable({
        label: 'Variable',
        required: true,
        returnType: ['SBooleanDescriptor'],
      }),
      label: schemaProps.scriptString({ label: 'Label' }),
      type: schemaProps.select({
        label: 'Type',
        values: ['checkbox', 'toggler'],
      }),
      disabled: schemaProps.boolean({ label: 'Disabled' }),
      inactive: schemaProps.boolean({ label: 'Inactive' }),
    },
    allowedVariables: ['BooleanDescriptor'],
    getComputedPropsFromVariable: v => ({
      script: createFindVariableScript(v),
    }),
  }),
);
