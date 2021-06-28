import * as React from 'react';
import {
  registerComponent,
  pageComponentFactory,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { store, useStore } from '../../../data/Stores/store';
import { Actions } from '../../../data';
import { Toggler } from '../../Inputs/Boolean/Toggler';
import { CheckBox } from '../../Inputs/Boolean/CheckBox';
import { WegasComponentProps } from '../tools/EditableComponent';
import { IScript, SBooleanDescriptor } from 'wegas-ts-api';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { useScript } from '../../Hooks/useScript';
import {
  OnVariableChange,
  onVariableChangeSchema,
  useOnVariableChange,
} from './tools';
import { TumbleLoader } from '../../Loader';
import { Player } from '../../../data/selectors';

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

  onVariableChange?: OnVariableChange;
}

function PlayerBoolean({
  script,
  type,
  label,
  options,
  context,
  className,
  style,
  id,
  onVariableChange,
}: PlayerBooleanProps) {
  const bool = useScript<SBooleanDescriptor | boolean>(script, context);

  const { handleOnChange } = useOnVariableChange(onVariableChange, context);

  const textLabel = useScript<string>(label, context);

  const BooleanComponent = type === 'toggler' ? Toggler : CheckBox;

  const value = useStore(() =>
    typeof bool === 'object' ? bool.getValue(Player.self()) : bool,
  );

  return bool == null ? (
    <TumbleLoader />
  ) : (
    <BooleanComponent
      className={className}
      style={style}
      id={id}
      label={textLabel}
      value={value}
      disabled={options.disabled || options.locked}
      readOnly={options.readOnly}
      onChange={v => {
        if (handleOnChange) {
          handleOnChange(v);
        } else if (typeof bool === 'object') {
          store.dispatch(
            Actions.VariableInstanceActions.runScript(
              `Variable.find(gameModel,"${bool.getName()}").setValue(self, ${v});`,
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
      script: schemaProps.scriptBoolean({
        label: 'Variable',
        required: true,
      }),
      label: schemaProps.scriptString({ label: 'Label' }),
      type: schemaProps.select({
        label: 'Type',
        values: ['checkbox', 'toggler'],
      }),
      onVariableChange: onVariableChangeSchema('On change action'),
    },
    allowedVariables: ['BooleanDescriptor'],
    getComputedPropsFromVariable: v => ({
      script: createFindVariableScript(v),
    }),
  }),
);
