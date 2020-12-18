import * as React from 'react';
import {
  registerComponent,
  pageComponentFactory,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { store } from '../../../data/store';
import { Actions } from '../../../data';
import { Toggler } from '../../Inputs/Boolean/Toggler';
import { CheckBox } from '../../Inputs/Boolean/CheckBox';
import { WegasComponentProps } from '../tools/EditableComponent';
import { IBooleanDescriptor, IScript } from 'wegas-ts-api';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { useScript } from '../../Hooks/useScript';
import {
  OnVariableChange,
  onVariableChangeSchema,
  useOnVariableChange,
} from './tools';
import { TumbleLoader } from '../../Loader';
import { useComponentScript } from '../../Hooks/useComponentScript';

interface PlayerBooleanProps extends WegasComponentProps {
  /**
   * script - the script that returns the variable to display and modify
   */
  script?: IScript;
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
  onVariableChange?: OnVariableChange;
}

function PlayerBoolean({
  script,
  type,
  label,
  disabled,
  inactive,
  context,
  className,
  style,
  id,
  onVariableChange,
}: PlayerBooleanProps) {
  const {
    descriptor,
    instance,
    notFound,
  } = useComponentScript<IBooleanDescriptor>(script, context);

  const { handleOnChange } = useOnVariableChange(onVariableChange, context);

  const textLabel = useScript<string>(label, context);

  const BooleanComponent = type === 'toggler' ? Toggler : CheckBox;

  return notFound ? (
    <TumbleLoader />
  ) : (
    <BooleanComponent
      className={className}
      style={style}
      id={id}
      label={textLabel}
      value={instance?.getValue()}
      disabled={disabled}
      readOnly={inactive}
      onChange={v => {
        if (handleOnChange) {
          handleOnChange(v);
        } else {
          store.dispatch(
            Actions.VariableInstanceActions.runScript(
              `Variable.find(gameModel,"${descriptor?.getName()}").setValue(self, ${v});`,
            ),
          );
        }
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
      script: schemaProps.scriptVariable({
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
      onVariableChange: onVariableChangeSchema('On change action'),
    },
    allowedVariables: ['BooleanDescriptor'],
    getComputedPropsFromVariable: v => ({
      script: createFindVariableScript(v),
    }),
  }),
);
