import { css, cx } from 'emotion';
import * as React from 'react';
// import * as ReactDOMServer from 'react-dom/server';
import { VariableDescriptor } from '../../data/selectors';
import { entityIs } from '../../data/entities';
import { getInstance } from '../../data/methods/VariableDescriptorMethods';
import { State as RState } from '../../data/Reducer/reducers';
import { ComponentWithForm } from './FormView/ComponentWithForm';
import {
  forceScroll,
  grow,
  flex,
  flexRow,
  flexColumn,
} from '../../css/classes';
import { shallowDifferent } from '../../Components/Hooks/storeHookFactory';
import {
  IDialogueDescriptor,
  IFSMDescriptor,
  IAbstractTransition,
  ITransition,
  IDialogueTransition,
  IState,
  IDialogueState,
} from 'wegas-ts-api';
import { Button } from '../../Components/Inputs/Buttons/Button';
import { SimpleInput } from '../../Components/Inputs/SimpleInput';
import HTMLEditor from '../../Components/HTMLEditor';
import {
  FlowChart,
  FlowLine,
  Process,
} from '../../Components/FlowChart/FlowChart';
import { store, StoreDispatch, useStore } from '../../data/Stores/store';
import { Actions } from '../../data';
import { createScript } from '../../Helper/wegasEntites';
import { languagesCTX } from '../../Components/Contexts/LanguagesProvider';
import { createTranslatableContent } from './FormView/translatable';
import { XYPosition } from '../../Components/Hooks/useMouseEventDnd';
import { deleteState, EditorAction } from '../../data/Reducer/globalState';
import { mainLayoutId } from './Layout';
import { focusTab } from './LinearTabLayout/LinearLayout';
import produce, { Immutable } from 'immer';
import { StateProcessComponent } from '../../Components/FlowChart/StateProcessComponent';
import { TransitionFlowLineComponent } from '../../Components/FlowChart/TransitionFlowLineComponent';
import { Text } from '../../Components/Outputs/Text';

const emptyPath: (string | number)[] = [];

export function searchWithState(
  search?: RState['global']['search'],
  searched?: string,
): boolean {
  let value = '';
  if (search == null || searched == null) {
    return false;
  }
  if (search.type === 'GLOBAL') {
    value = search.value;
  } else if (search.type === 'USAGE') {
    const variable = VariableDescriptor.select(search.value);
    if (variable) {
      value = `Variable.find(gameModel, "${variable.name}")`;
    }
  }
  return value !== '' && searched.indexOf(value) >= 0;
}

function deleteTransition<T extends IFSMDescriptor | IDialogueDescriptor>(
  stateMachine: Immutable<T>,
  stateId: number,
  transitionId: number,
) {
  const newStateMachine = produce((stateMachine: T) => {
    const transitions = stateMachine.states[stateId].transitions;
    transitions.splice(transitionId, 1);
  })(stateMachine);

  store.dispatch(
    Actions.VariableDescriptorActions.updateDescriptor(newStateMachine),
  );
}

export interface TransitionFlowLine extends FlowLine {
  transition: ITransition | IDialogueTransition;
}

export interface StateProcess extends Process<TransitionFlowLine> {
  state: IState | IDialogueState;
}

interface StateMachineEditorProps<
  IFSM extends IFSMDescriptor | IDialogueDescriptor
> {
  stateMachine: Immutable<IFSM>;
  stateMachineInstance: IFSM['defaultInstance'];
  localDispatch?: StoreDispatch;
  forceLocalDispatch?: boolean;
  search?: RState['global']['search'];
  title?: string;
  editPath: (string | number)[] | undefined;
}
export function StateMachineEditor<
  IFSM extends IFSMDescriptor | IDialogueDescriptor
>({
  title,
  stateMachine,
  localDispatch,
  forceLocalDispatch,
  editPath = emptyPath,
}: //search,
StateMachineEditorProps<IFSM>) {
  type TState = IFSM['states'][0];
  type TTransition = TState['transitions'][0];

  const { lang } = React.useContext(languagesCTX);

  const processes: StateProcess[] = React.useMemo(
    () =>
      Object.entries(stateMachine.states).map(([key, state]) => ({
        state: state as TState,
        id: key,
        position: { x: state.x, y: state.y },
        connections: (state.transitions as IAbstractTransition[]).map(
          (transition, i) => ({
            transition: transition as TTransition,
            id: String(i),
            connectedTo: String(transition.nextStateId),
          }),
        ),
      })),
    [stateMachine.states],
  );

  const createTransition: (
    nextStateId: number,
    index: number,
  ) => TTransition = React.useCallback(
    (nextStateId, index) => {
      return {
        ...{
          version: 0,
          nextStateId,
          preStateImpact: createScript(),
          triggerCondition: createScript(),
          index,
        },
        ...(entityIs(stateMachine, 'FSMDescriptor')
          ? { '@class': 'Transition', label: '' }
          : {
              '@class': 'DialogueTransition',
              actionText: createTranslatableContent(lang),
            }),
      };
    },
    [lang, stateMachine],
  );

  const connectState = React.useCallback(
    (
      sourceState: StateProcess,
      targetState: StateProcess,
      transition?: TransitionFlowLine,
      backward?: boolean,
    ) => {
      const newTransition: TTransition =
        transition != null
          ? {
              ...transition.transition,
              nextStateId: backward
                ? transition.transition.nextStateId
                : Number(targetState.id),
              index: backward
                ? sourceState.state.transitions.length
                : transition.transition.index,
            }
          : createTransition(
              Number(targetState.id),
              sourceState.state.transitions.length,
            );

      const newStateMachine = produce((stateMachine: IFSM) => {
        const source = stateMachine.states[Number(sourceState.id)];
        const target = stateMachine.states[Number(targetState.id)];

        if (backward) {
          target.transitions = (target.transitions as TTransition[]).filter(
            t => transition == null || t.id !== transition.transition.id,
          ) as typeof target.transitions;
          // (source.transitions as IAbstractTransition[]).push(newTransition);
        } else {
          source.transitions = (source.transitions as TTransition[]).filter(
            t => transition == null || t.id !== transition.transition.id,
          ) as typeof source.transitions;
        }
        (source.transitions as IAbstractTransition[]).push(newTransition);
      })(stateMachine);

      store.dispatch(
        Actions.VariableDescriptorActions.updateDescriptor(newStateMachine),
      );
    },
    [createTransition, stateMachine],
  );

  const updateStatePosition = React.useCallback(
    (sourceState: StateProcess, position: XYPosition) => {
      const newStateMachine = produce((stateMachine: IFSM) => {
        stateMachine.states[Number(sourceState.id)].x =
          position.x >= 10 ? position.x : 10;
        stateMachine.states[Number(sourceState.id)].y =
          position.y >= 10 ? position.y : 10;
      })(stateMachine);

      store.dispatch(
        Actions.VariableDescriptorActions.updateDescriptor(
          newStateMachine,
          false,
        ),
      );
    },
    [stateMachine],
  );

  const createState = React.useCallback(
    (
      sourceProcess: StateProcess,
      position: XYPosition,
      transition?: TransitionFlowLine,
      backward?: boolean,
    ) => {
      const newState: TState = {
        ...{
          version: 0,
          onEnterEvent: createScript(),
          x: position.x >= 10 ? position.x : 10,
          y: position.y >= 10 ? position.y : 10,
          transitions: (backward && transition != null
            ? [transition.transition]
            : []) as (ITransition & IDialogueTransition)[],
        },
        ...(entityIs(stateMachine, 'FSMDescriptor')
          ? { '@class': 'State', label: '' }
          : {
              '@class': 'DialogueState',
              text: createTranslatableContent(lang),
            }),
      };

      const newStateId =
        (Number(
          Object.keys(stateMachine.states)
            .sort((a, b) => Number(a) - Number(b))
            .pop(),
        ) || 0) + 1;

      const newTransition = transition
        ? { ...transition.transition, nextStateId: newStateId }
        : createTransition(newStateId, sourceProcess.state.transitions.length);

      const newStateMachine = produce((stateMachine: IFSM) => {
        // Adding new state
        stateMachine.states[newStateId] = newState;

        // Removing transition from state
        const currentState = stateMachine.states[Number(sourceProcess.id)];
        currentState.transitions = (currentState.transitions as TTransition[]).filter(
          t => transition == null || t.id !== transition.transition.id,
        ) as typeof currentState.transitions;

        if (!backward) {
          // Adding new transition
          (currentState.transitions as TTransition[]).push(newTransition);
        }
      })(stateMachine);

      store.dispatch(
        Actions.EditorActions.editStateMachine(stateMachine, [
          'states',
          String(newStateId),
        ]),
      );
      store.dispatch(
        Actions.VariableDescriptorActions.updateDescriptor(newStateMachine),
      );
    },
    [createTransition, lang, stateMachine],
  );

  const onStateClick = React.useCallback(
    (e: ModifierKeysEvent, state: StateProcess) => {
      const actions: EditorAction<
        IFSMDescriptor | IDialogueDescriptor
      >['more'] = {};
      if (state.state.id !== stateMachine.defaultInstance.currentStateId) {
        actions.delete = {
          label: 'Delete',
          confirm: true,
          action: (
            sm: IFSMDescriptor | IDialogueDescriptor,
            path?: (string | number)[],
          ) => {
            if (path != null && path.length === 2) {
              deleteState(sm, Number(path[1]));
            }
          },
        };
      }

      const dispatchLocal =
        (e.ctrlKey === true || forceLocalDispatch === true) &&
        localDispatch != null;
      const dispatch = dispatchLocal ? localDispatch! : store.dispatch;
      dispatch(
        Actions.EditorActions.editStateMachine(stateMachine, [
          'states',
          state.id,
        ]),
      );
      if (!dispatchLocal) {
        focusTab(mainLayoutId, 'Variable Properties');
      }
    },
    [forceLocalDispatch, localDispatch, stateMachine],
  );

  const onFlowlineClick = React.useCallback(
    (
      e: ModifierKeysEvent,
      startProcess: StateProcess,
      flowline: TransitionFlowLine,
    ) => {
      const actions: EditorAction<
        IFSMDescriptor | IDialogueDescriptor
      >['more'] = {};
      actions.delete = {
        label: 'Delete',
        confirm: true,
        action: (
          sm: IFSMDescriptor | IDialogueDescriptor,
          path?: (string | number)[],
        ) => {
          if (path != null && path?.length === 4) {
            deleteTransition(sm, Number(path[1]), Number(path[3]));
          }
        },
      };

      const dispatchLocal =
        (e.ctrlKey === true || forceLocalDispatch === true) &&
        localDispatch != null;
      const dispatch = dispatchLocal ? localDispatch! : store.dispatch;
      dispatch(
        Actions.EditorActions.editVariable(
          stateMachine,
          ['states', startProcess.id, 'transitions', flowline.id],
          undefined,
          {
            more: actions,
          },
        ),
      );
      if (!dispatchLocal) {
        focusTab(mainLayoutId, 'Variable Properties');
      }
    },
    [forceLocalDispatch, localDispatch, stateMachine],
  );

  const isFlowlineSelected = React.useCallback(
    (sourceProcess: StateProcess, flowline: TransitionFlowLine) => {
      return (
        editPath.length === 4 &&
        editPath[0] === 'states' &&
        editPath[1] === sourceProcess.id &&
        editPath[2] === 'transitions' &&
        editPath[3] === flowline.id
      );
    },
    [editPath],
  );

  const isProcessSelected = React.useCallback(
    (sourceProcess: StateProcess) => {
      return (
        editPath.length === 2 &&
        editPath[0] === 'states' &&
        editPath[1] === sourceProcess.id
      );
    },
    [editPath],
  );

  return (
    <FlowChart
      title={title}
      processes={processes}
      onConnect={connectState}
      onMove={updateStatePosition}
      onNew={createState}
      onFlowlineClick={onFlowlineClick}
      onProcessClick={onStateClick}
      isFlowlineSelected={isFlowlineSelected}
      isProcessSelected={isProcessSelected}
      Process={StateProcessComponent}
      Flowline={TransitionFlowLineComponent}
    />
  );
}

function globalStateSelector(s: RState) {
  let editedVariable:
    | IFSMDescriptor
    | IDialogueDescriptor
    | undefined = undefined;
  let editPath: (string | number)[] | undefined = undefined;
  if (
    s.global.editing &&
    (s.global.editing.type === 'VariableFSM' ||
      // The following condition seems stupid, need to be tested ans documented
      s.global.editing.type === 'Variable')
  ) {
    editedVariable = s.global.editing.entity as
      | IFSMDescriptor
      | IDialogueDescriptor;
    const lastFSM = VariableDescriptor.select(s.global.editing.entity.id) as
      | IFSMDescriptor
      | IDialogueDescriptor;
    if (shallowDifferent(editedVariable, lastFSM)) {
      editedVariable = lastFSM;
    }
    editPath = s.global.editing.path;
  }
  const instance = editedVariable ? getInstance(editedVariable) : undefined;
  if (
    !entityIs(editedVariable, 'TriggerDescriptor', true) &&
    entityIs(editedVariable, 'AbstractStateMachineDescriptor', true) &&
    entityIs(instance, 'FSMInstance', true)
  ) {
    return {
      descriptor: editedVariable,
      instance,
      search: s.global.search,
      editPath,
    };
  } else {
    return {
      variable: editedVariable,
    };
  }
}

export function ConnectedStateMachineEditor({
  localDispatch,
}: {
  localDispatch?: StoreDispatch;
}) {
  const globalState = useStore(globalStateSelector);

  if ('variable' in globalState) {
    if (globalState.variable == null) {
      return <span>Select a variable to display</span>;
    } else {
      return (
        <span>The selected variable is not some kind of state machine</span>
      );
    }
  } else {
    return (
      <div className={cx(grow, forceScroll)}>
        <StateMachineEditor
          stateMachine={globalState.descriptor}
          stateMachineInstance={globalState.instance}
          localDispatch={localDispatch}
          search={globalState.search}
          editPath={globalState.editPath}
        />
      </div>
    );
  }
}

export default function StateMachineEditorWithMeta() {
  return (
    <ComponentWithForm entityEditor>
      {({ localDispatch }) => {
        return <ConnectedStateMachineEditor localDispatch={localDispatch} />;
      }}
    </ComponentWithForm>
  );
}

const stateTextStyle = css({
  cursor: 'text',
});

interface ModifiableTextProps {
  mode: 'String' | 'Text';
  initialValue: string;
  onValidate: (newValue: string) => void;
}

// Currently this component is not used but it will be in the future
// @ts-ignore
function ModifiableText({
  mode,
  initialValue,
  onValidate,
}: ModifiableTextProps) {
  const [editingText, setEditingText] = React.useState(false);
  const [newTextValue, setNewTextValue] = React.useState(initialValue);

  React.useEffect(() => {
    setNewTextValue(initialValue);
  }, [initialValue]);

  return editingText ? (
    <div className={cx(flex, flexRow)}>
      <div className={grow}>
        {mode === 'String' ? (
          <SimpleInput
            placeholder="State label"
            value={newTextValue}
            onChange={value => setNewTextValue(String(value))}
          />
        ) : (
          <HTMLEditor value={newTextValue} onChange={setNewTextValue} />
        )}
      </div>
      <div className={cx(flex, flexColumn)}>
        <Button
          icon="times"
          onClick={() => {
            setEditingText(false);
          }}
        />
        <Button
          icon="check"
          onClick={() => {
            setEditingText(false);
            onValidate(newTextValue);
          }}
        />
      </div>
    </div>
  ) : newTextValue === '' ? (
    <div onClick={() => setEditingText(true)}>
      {`Click here to edit ${mode === 'String' ? 'label' : 'text'}`}
    </div>
  ) : (
    <div onClick={() => setEditingText(true)} className={stateTextStyle}>
      <Text text={newTextValue} />
    </div>
  );
}
