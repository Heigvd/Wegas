import * as React from 'react';
import {
  registerComponent,
  pageComponentFactory,
  PageComponentMandatoryProps,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { useVariableInstance } from '../../Hooks/useVariable';
import { store } from '../../../data/store';
import { Actions } from '../../../data';
import { useScript } from '../../Hooks/useScript';
import { Toggler } from '../../Inputs/Button/Toggler';

interface PlayerBooleanProps extends PageComponentMandatoryProps {
  /**
   * script - the script that returns the variable to display and modify
   */
  script?: IScript;
  /**
   * type - the behaviour and style of the component
   */
  type?: 'radio' | 'checkbox' | 'toggler';
  /**
   * inactive - if true, the component will only display the boolean but the user won't be abe to change it
   */
  inactive?: boolean;
  /**
   * disabled - if true, the component will be disabled
   */
  disabled?: boolean;
  /**
   * className - additionnal classes for the component
   */
  className?: string;
}

const PlayerBoolean: React.FunctionComponent<PlayerBooleanProps> = props => {
  const { EditHandle } = props;
  const script = props.script ? props.script.content : '';
  const descriptor = useScript(script) as IBooleanDescriptor;
  const instance = useVariableInstance(descriptor);

  return (
    <>
      <EditHandle />
      {script === '' || descriptor === undefined || instance === undefined ? (
        <pre>Not found: {script}</pre>
      ) : props.type === 'toggler' ? (
        <Toggler
          togglerClassName={props.className}
          defaultChecked={instance.value}
          disabled={props.disabled}
          inactive={props.inactive}
          onClick={() => {
            store.dispatch(
              Actions.VariableInstanceActions.runScript(
                `${script}.setValue(self, ${!instance.value});`,
              ),
            );
          }}
        />
      ) : (
        <input
          className={props.className}
          type={props.type ? props.type : 'checkbox'}
          defaultChecked={instance.value}
          disabled={props.disabled || props.inactive}
          readOnly={props.inactive}
          onClick={() =>
            store.dispatch(
              Actions.VariableInstanceActions.runScript(
                `${script}.setValue(self, ${!instance.value});`,
              ),
            )
          }
        />
      )}
    </>
  );
};

registerComponent(
  pageComponentFactory(
    PlayerBoolean,
    'Boolean',
    'check-square',
    {
      script: schemaProps.scriptVariable('Variable', true, [
        'BooleanDescriptor',
      ]),
      type: schemaProps.select('Type', false, ['radio', 'checkbox', 'toggler']),
      disabled: schemaProps.boolean('Disabled', false),
      inactive: schemaProps.boolean('Inactive', false),
      className: schemaProps.string('Classes', false),
    },
    ['ISBooleanDescriptor'],
    () => ({}),
  ),
);
