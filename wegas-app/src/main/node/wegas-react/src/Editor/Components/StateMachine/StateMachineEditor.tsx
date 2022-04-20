import produce, { Immutable } from 'immer';
import { cloneDeep } from 'lodash';
import * as React from 'react';
import {
  IAbstractTransition,
  IDialogueDescriptor,
  IDialogueState,
  IDialogueTransition,
  IFSMDescriptor,
  IState,
  ITransition,
} from 'wegas-ts-api';
import { languagesCTX } from '../../../Components/Contexts/LanguagesProvider';
import {
  FlowChart,
  FlowLine,
  Process,
} from '../../../Components/FlowChart/FlowChart';
import { StateProcessComponent } from '../../../Components/FlowChart/StateProcessComponent';
import { TransitionFlowLineComponent } from '../../../Components/FlowChart/TransitionFlowLineComponent';
import { shallowDifferent } from '../../../Components/Hooks/storeHookFactory';
import { XYPosition } from '../../../Components/Hooks/useMouseEventDnd';
import { useOnEditionChangesModal } from '../../../Components/Modal';
import { grow, mediumPadding } from '../../../css/classes';
import { Actions } from '../../../data';
import { entityIs } from '../../../data/entities';
import {
  editorLabel,
  getInstance,
} from '../../../data/methods/VariableDescriptorMethods';
import {
  EditingState,
  Edition,
  editStateMachine,
  saveEditor,
} from '../../../data/Reducer/editingState';
import { State as RState } from '../../../data/Reducer/reducers';
// import * as ReactDOMServer from 'react-dom/server';
import { VariableDescriptor } from '../../../data/selectors';
import {
  editingStore,
  EditingStoreDispatch,
  useEditingStore,
} from '../../../data/Stores/editingStore';
import { store, useStore } from '../../../data/Stores/store';
import { lastKeyboardEvents } from '../../../Helper/keyboardEvents';
import { createScript } from '../../../Helper/wegasEntites';
import { editorTabsTranslations } from '../../../i18n/editorTabs/editorTabs';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { mainLayoutId } from '../../layouts';
import { ComponentWithForm } from '../FormView/ComponentWithForm';
import { createTranslatableContent } from '../FormView/translatable';
import { focusTab } from '../LinearTabLayout/LinearLayout';
import { LiteFlowLineComponentFactory } from './LiteFlowLineComponent';
import { LiteStateProcessComponentFactory } from './LiteProcessComponent';

const emptyPath: (string | number)[] = [];

export interface TransitionFlowLine extends FlowLine {
  transition: ITransition | IDialogueTransition;
}

export interface StateProcess extends Process<TransitionFlowLine> {
  state: IState | IDialogueState;
}

interface StateMachineEditorProps<
  IFSM extends IFSMDescriptor | IDialogueDescriptor,
> extends DisabledReadonly {
  stateMachine: Immutable<IFSM>;
  stateMachineInstance: IFSM['defaultInstance'];
  localState?: Readonly<Edition> | undefined;

  localDispatch?: EditingStoreDispatch;
  forceLocalDispatch?: boolean;
  search?: RState['global']['search'];
  title?: string;
  editPath?: (string | number)[] | undefined;
  /**
   * Simplifies interface for content creation
   */
  lite?: boolean;
}
export function StateMachineEditor<
  IFSM extends IFSMDescriptor | IDialogueDescriptor,
>({
  title,
  stateMachine,
  localState,
  localDispatch,
  forceLocalDispatch,
  editPath = emptyPath,
  search, // TODO:Implement search in Flowchart
  lite,
  ...options
}: StateMachineEditorProps<IFSM>) {
  type TState = IFSM['states'][0];
  type TTransition = TState['transitions'][0];

  // const computedForceLocalDispatch = !lite && forceLocalDispatch;

  const { lang } = React.useContext(languagesCTX);
  const onEditionChanges = useOnEditionChangesModal(
    forceLocalDispatch,
    localState,
    localDispatch,
  );

  const dispatch = React.useMemo(
    () =>
      localDispatch != null && forceLocalDispatch
        ? localDispatch!
        : editingStore.dispatch,
    [forceLocalDispatch, localDispatch],
  );

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

  const createTransition: (nextStateId: number, index: number) => TTransition =
    React.useCallback(
      (nextStateId, index) => {
        return {
          ...{
            version: 0,
            nextStateId,
            preStateImpact: createScript(),
            triggerCondition: createScript(),
            dependencies: [],
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

      dispatch(
        Actions.VariableDescriptorActions.updateDescriptor(newStateMachine),
      );
    },
    [createTransition, dispatch, stateMachine],
  );

  const onStateClick = React.useCallback(
    (e: ModifierKeysEvent, state: StateProcess) => {
      const dispatchLocal =
        (e.ctrlKey === true || forceLocalDispatch === true) &&
        localDispatch != null;

      const dispatch = dispatchLocal ? localDispatch! : editingStore.dispatch;
      dispatch(editStateMachine(stateMachine, ['states', state.id]));
      if (!dispatchLocal) {
        focusTab(mainLayoutId, 'Variable Properties');
      }
    },
    [forceLocalDispatch, localDispatch, stateMachine],
  );

  const onSafeStateClick = React.useCallback(
    (e: ModifierKeysEvent, state: StateProcess) => {
      onEditionChanges(state.state.id!, e, e => onStateClick(e, state));
    },
    [onEditionChanges, onStateClick],
  );

  const updateStatePosition = React.useCallback(
    (sourceState: StateProcess, position: XYPosition) => {
      const state = editingStore.getState();

      const currentState =
        state.editing?.type === 'VariableFSM' &&
        state.editing.newEntity != null &&
        state.editing.newEntity.id === sourceState.state.id
          ? (state.editing.newEntity as unknown as StateProcess['state'])
          : sourceState.state;

      const newCurrentState: IState | IDialogueState = {
        ...currentState,
        x: position.x >= 10 ? position.x : 10,
        y: position.y >= 10 ? position.y : 10,
      };

      const oldFSM = cloneDeep(
        store.getState().variableDescriptors[newCurrentState.parentId!]!,
      ) as IFSMDescriptor;
      oldFSM.states[newCurrentState.index!] = newCurrentState as IState;

      dispatch(saveEditor(oldFSM, false));
    },
    [dispatch],
  );

  const safeUpdateStatePosition = React.useCallback(
    (sourceState: StateProcess, position: XYPosition, e: MouseEvent) => {
      onEditionChanges(sourceState.state.id!, e, () =>
        updateStatePosition(sourceState, position),
      );
    },
    [onEditionChanges, updateStatePosition],
  );

  const createState = React.useCallback(
    (
      sourceProcess: StateProcess,
      position: XYPosition,
      e: ModifierKeysEvent,
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
        currentState.transitions = (
          currentState.transitions as TTransition[]
        ).filter(
          t => transition == null || t.id !== transition.transition.id,
        ) as typeof currentState.transitions;

        if (!backward) {
          // Adding new transition
          (currentState.transitions as TTransition[]).push(newTransition);
        }
      })(stateMachine);

      const dispatchLocal =
        (e.ctrlKey === true || forceLocalDispatch === true) &&
        localDispatch != null;
      const dispatch = dispatchLocal ? localDispatch! : editingStore.dispatch;

      if (!dispatchLocal) {
        focusTab(mainLayoutId, 'Variable Properties');
      }

      dispatch(editStateMachine(stateMachine, ['states', String(newStateId)]));
      dispatch(
        Actions.VariableDescriptorActions.updateDescriptor(newStateMachine),
      );
    },
    [createTransition, forceLocalDispatch, lang, localDispatch, stateMachine],
  );

  const safeCreateState = React.useCallback(
    (
      sourceProcess: StateProcess,
      position: XYPosition,
      transition?: TransitionFlowLine,
      backward?: boolean,
    ) => {
      onEditionChanges(0, lastKeyboardEvents, lastKeyboardEvents =>
        createState(
          sourceProcess,
          position,
          lastKeyboardEvents,
          transition,
          backward,
        ),
      );
    },
    [createState, onEditionChanges],
  );

  const onFlowlineClick = React.useCallback(
    (
      e: ModifierKeysEvent,
      startProcess: StateProcess,
      flowline: TransitionFlowLine,
    ) => {
      const dispatchLocal =
        (e.ctrlKey === true || forceLocalDispatch === true) &&
        localDispatch != null;
      const dispatch = dispatchLocal ? localDispatch! : editingStore.dispatch;
      dispatch(
        editStateMachine(
          stateMachine,
          ['states', startProcess.id, 'transitions', flowline.id],
          undefined,
        ),
      );
      if (!dispatchLocal) {
        focusTab(mainLayoutId, 'Variable Properties');
      }
    },
    [forceLocalDispatch, localDispatch, stateMachine],
  );

  const onSafeFlowlineClick = React.useCallback(
    (
      e: ModifierKeysEvent,
      startProcess: StateProcess,
      flowline: TransitionFlowLine,
    ) => {
      onEditionChanges(flowline.transition.id!, e, e =>
        onFlowlineClick(e, startProcess, flowline),
      );
    },
    [onEditionChanges, onFlowlineClick],
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

  const Process = React.useMemo(() => {
    if (lite) {
      return LiteStateProcessComponentFactory(stateMachine, dispatch);
    } else {
      return StateProcessComponent;
    }
  }, [dispatch, lite, stateMachine]);

  const Flowline = React.useMemo(() => {
    if (lite) {
      return LiteFlowLineComponentFactory(stateMachine, dispatch);
    } else {
      return TransitionFlowLineComponent;
    }
  }, [dispatch, lite, stateMachine]);

  return (
    <FlowChart
      title={title || <h3>{editorLabel(stateMachine)}</h3>}
      processes={processes}
      onConnect={connectState}
      onMove={safeUpdateStatePosition}
      onNew={safeCreateState}
      onFlowlineClick={onSafeFlowlineClick}
      onProcessClick={onSafeStateClick}
      isFlowlineSelected={isFlowlineSelected}
      isProcessSelected={isProcessSelected}
      Process={Process}
      Flowline={Flowline}
      {...options}
    />
  );
}

export function editingStateSelector(s: EditingState) {
  let editedVariable: IFSMDescriptor | IDialogueDescriptor | undefined =
    undefined;
  let editPath: (string | number)[] | undefined = undefined;
  if (
    s.editing &&
    (s.editing.type === 'VariableFSM' ||
      // The following condition seems stupid, need to be tested ans documented
      s.editing.type === 'Variable')
  ) {
    editedVariable = s.editing.entity as IFSMDescriptor | IDialogueDescriptor;
    const lastFSM = VariableDescriptor.select(s.editing.entity.id) as
      | IFSMDescriptor
      | IDialogueDescriptor;
    if (shallowDifferent(editedVariable, lastFSM)) {
      editedVariable = lastFSM;
    }
    editPath = s.editing.path;
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
      editPath,
    };
  } else {
    return {
      variable: editedVariable,
    };
  }
}

export function globalStateSelector(s: RState) {
  return s.global.search;
}

interface ConnectedStateMachineEditorProps extends DisabledReadonly {
  localState?: Readonly<Edition> | undefined;
  localDispatch?: EditingStoreDispatch;
  forceLocalDispatch?: boolean;
}

export function ConnectedStateMachineEditor({
  localState,
  localDispatch,
  forceLocalDispatch,
  ...options
}: ConnectedStateMachineEditorProps) {
  const editingState = useEditingStore(editingStateSelector);
  const search = useStore(globalStateSelector);
  const i18nValues = useInternalTranslate(editorTabsTranslations);

  if ('variable' in editingState) {
    if (editingState.variable == null) {
      return (
        <span className={mediumPadding}>
          {i18nValues.stateMachine.selectVariable}
        </span>
      );
    } else {
      return (
        <span className={mediumPadding}>
          {i18nValues.stateMachine.selectedNotStateMachine}
        </span>
      );
    }
  } else {
    return (
      <div className={grow}>
        <StateMachineEditor
          localState={localState}
          localDispatch={localDispatch}
          forceLocalDispatch={forceLocalDispatch}
          stateMachine={editingState.descriptor}
          stateMachineInstance={editingState.instance}
          search={search}
          editPath={editingState.editPath}
          {...options}
        />
      </div>
    );
  }
}

export default function StateMachineEditorWithMeta({
  disabled,
  readOnly,
}: DisabledReadonly) {
  return (
    <ComponentWithForm disabled={disabled} readOnly={readOnly}>
      {({ localDispatch, localState }) => {
        return (
          <ConnectedStateMachineEditor
            localState={localState}
            localDispatch={localDispatch}
            disabled={disabled}
            readOnly={readOnly}
          />
        );
      }}
    </ComponentWithForm>
  );
}
