import * as React from 'react';
import { IScript, SFSMDescriptor } from 'wegas-ts-api';
import { createStoreConnector } from '../../../data/connectStore';
import { Player } from '../../../data/selectors';
import { editingStoreFactory } from '../../../data/Stores/editingStore';
import {
  ComponentWithForm,
  ComponentWithFormFlexValues,
  flexValuesSchema,
} from '../../../Editor/Components/FormView/ComponentWithForm';
import { pageCTX } from '../../../Editor/Components/Page/PageEditor';
import { StateMachineEditor } from '../../../Editor/Components/StateMachine/StateMachineEditor';
import { shallowDifferent } from '../../Hooks/storeHookFactory';
import { useScript } from '../../Hooks/useScript';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { schemaProps } from '../tools/schemaProps';

interface PlayerStateMachineProps extends WegasComponentProps {
  stateMachine?: IScript;
  title?: IScript;
  flexValues?: ComponentWithFormFlexValues;
  /**
   * Simplifies interface for content creation
   */
  lite?: boolean;
}

export default function PlayerStateMachine({
  stateMachine,
  title,
  flexValues,
  lite,
  context,
  className,
  style,
  id,
  options,
}: PlayerStateMachineProps) {
  const { editMode } = React.useContext(pageCTX);
  const titleText = useScript<string>(title, context);
  const FSM = useScript<SFSMDescriptor>(stateMachine, context);
  const descriptor = FSM?.getEntity();
  const instance = FSM?.getInstance(Player.self()).getEntity();

  const { useStore: useLocalStore, getDispatch: getLocalDispatch } =
    React.useMemo(() => createStoreConnector(editingStoreFactory()), []);
  const localState = useLocalStore(s => s, shallowDifferent);
  const localDispatch = getLocalDispatch();

  return descriptor == null || instance == null ? (
    <pre className={className} style={style} id={id}>
      State machine not found
    </pre>
  ) : lite ? (
    <StateMachineEditor
      title={titleText}
      stateMachine={descriptor}
      stateMachineInstance={instance}
      localDispatch={localDispatch}
      editPath={
        localState.editing?.type === 'VariableFSM'
          ? localState.editing.path
          : undefined
      }
      disabled={editMode || options.disabled || options.locked}
      readOnly={options.readOnly}
      lite={lite}
      forceLocalDispatch
    />
  ) : (
    <ComponentWithForm
      flexValues={flexValues}
      disabled={options.disabled || options.locked}
      readOnly={options.readOnly}
    >
      {({ localDispatch, localState }) => {
        return (
          <StateMachineEditor
            title={titleText}
            stateMachine={descriptor}
            stateMachineInstance={instance}
            localDispatch={localDispatch}
            editPath={
              localState?.type === 'VariableFSM' ? localState.path : undefined
            }
            forceLocalDispatch
            disabled={editMode || options.disabled || options.locked}
            readOnly={options.readOnly}
            lite={lite}
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
    illustration: 'stateMachine',
    schema: {
      stateMachine: schemaProps.scriptVariable({
        label: 'State machine',
        required: true,
        returnType: ['SFSMDescriptor', 'SDialogueDescriptor'],
      }),
      title: schemaProps.scriptString({ label: 'Title', richText: true }),
      flexValues: flexValuesSchema,
      lite: schemaProps.boolean({ label: 'Easy editor', value: true }),
    },
    allowedVariables: ['FSMDescriptor', 'DialogueDescriptor'],
  }),
);
