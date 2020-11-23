import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { WegasComponentProps } from '../tools/EditableComponent';
import { useScript } from '../../Hooks/useScript';
import { useStore } from '../../../data/store';
import { IScript, SFSMDescriptor } from 'wegas-ts-api';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { StateMachineEditor } from '../../../Editor/Components/StateMachineEditor';
import { Player } from '../../../data/selectors';
import { ComponentWithForm } from '../../../Editor/Components/FormView/ComponentWithForm';
import { instantiate } from '../../../data/scriptable';

interface PlayerStateMachineProps extends WegasComponentProps {
  stateMachine?: IScript;
}

export default function PlayerStateMachine({
  stateMachine,
  context,
  className,
  style,
  id,
}: PlayerStateMachineProps) {
  const player = instantiate(useStore(Player.selectCurrent));
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
    },
    allowedVariables: ['FSMDescriptor', 'DialogueDescriptor'],
    getComputedPropsFromVariable: v => ({
      questionList: createFindVariableScript(v),
      style: {
        overflow: 'auto',
      },
    }),
  }),
);
