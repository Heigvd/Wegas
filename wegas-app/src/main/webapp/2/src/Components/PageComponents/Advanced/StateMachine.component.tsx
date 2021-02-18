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
import { ComponentWithForm } from '../../../Editor/Components/FormView/ComponentWithForm';
import { useCurrentPlayer } from '../../../data/selectors/Player';

interface PlayerStateMachineProps extends WegasComponentProps {
  stateMachine?: IScript;
  title?: IScript;
}

export default function PlayerStateMachine({
  stateMachine,
  title,
  context,
  className,
  style,
  id,
}: PlayerStateMachineProps) {
  const player = useCurrentPlayer();
  const titleText = useScript<string>(title, context);
  const FSM = useScript<SFSMDescriptor>(stateMachine, context);
  const descriptor = FSM?.getEntity();
  const instance = FSM?.getInstance(player).getEntity();

  return descriptor == null || instance == null ? (
    <pre className={className} style={style} id={id}>
      State machine not found
    </pre>
  ) : (
    <ComponentWithForm entityEditor>
      {({ localDispatch }) => {
        return (
          <StateMachineEditor
            title={titleText}
            stateMachine={descriptor}
            stateMachineInstance={instance}
            localDispatch={localDispatch}
            forceLocalDispatch
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
    },
    allowedVariables: ['FSMDescriptor', 'DialogueDescriptor'],
  }),
);
