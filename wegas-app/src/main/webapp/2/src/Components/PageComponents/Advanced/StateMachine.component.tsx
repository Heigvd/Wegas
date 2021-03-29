import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { WegasComponentProps } from '../tools/EditableComponent';
import { useScript } from '../../Hooks/useScript';
import { IScript, SFSMDescriptor } from 'wegas-ts-api';
import { StateMachineEditor } from '../../../Editor/Components/StateMachineEditor';
import {
  ComponentWithForm,
  ComponentWithFormFlexValues,
  flexValuesSchema,
} from '../../../Editor/Components/FormView/ComponentWithForm';
import { Player } from '../../../data/selectors';

interface PlayerStateMachineProps extends WegasComponentProps {
  stateMachine?: IScript;
  title?: IScript;
  flexValues?: ComponentWithFormFlexValues;
}

export default function PlayerStateMachine({
  stateMachine,
  title,
  flexValues,
  context,
  className,
  style,
  id,
  options,
}: PlayerStateMachineProps) {
  const titleText = useScript<string>(title, context);
  const FSM = useScript<SFSMDescriptor>(stateMachine, context);
  const descriptor = FSM?.getEntity();
  const instance = FSM?.getInstance(Player.self()).getEntity();

  return descriptor == null || instance == null ? (
    <pre className={className} style={style} id={id}>
      State machine not found
    </pre>
  ) : (
    <ComponentWithForm
      flexValues={flexValues}
      entityEditor
      disabled={options.disabled || options.locked}
      readOnly={options.readOnly}
    >
      {({ localDispatch }) => {
        return (
          <StateMachineEditor
            title={titleText}
            stateMachine={descriptor}
            stateMachineInstance={instance}
            localDispatch={localDispatch}
            forceLocalDispatch
            disabled={options.disabled || options.locked}
            readOnly={options.readOnly}
          />
        );
      }}
    </ComponentWithForm>
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerStateMachine,
    componentType: 'Advanced',
    name: 'State machine',
    icon: 'atom',
    schema: {
      stateMachine: schemaProps.scriptVariable({
        label: 'State machine',
        required: true,
        returnType: ['SFSMDescriptor', 'SDialogueDescriptor'],
      }),
      title: schemaProps.scriptString({ label: 'Title', richText: true }),
      flexValues: flexValuesSchema,
    },
    allowedVariables: ['FSMDescriptor', 'DialogueDescriptor'],
  }),
);
