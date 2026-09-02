import { Immutable, produce } from 'immer';
import { Schema } from 'jsoninput';
import {
  IAbstractContentDescriptor,
  IAbstractEntity,
  IAbstractState,
  IAbstractStateMachineDescriptor,
  IAbstractTransition,
  IChoiceDescriptor,
  IDialogueDescriptor,
  IFSMDescriptor,
  IListDescriptor,
  IPeerReviewDescriptor,
  IQuestionDescriptor,
  IVariableDescriptor,
  IWhQuestionDescriptor,
} from 'wegas-ts-api';
import { Actions as ACTIONS, Actions } from '..';
import { FileAPI } from '../../API/files.api';
import { AvailableViews } from '../../Editor/Components/FormView';
import {
  discardUnsavedChanges,
  fileEdit,
  fsmEdit,
  selectEdition,
  variableCreate,
  VariableCreateEdition,
  variableEdit,
} from '../../store/slices/edition';
import {
  editorEventAdded,
  editorEventRead as editorEventReadAction,
  editorEventRemoved,
} from '../../store/slices/editorEvents';
import { AppThunk, dispatch } from '../../store/store';
import { triggerEventHandlers } from '../actions';
import { VariableDescriptor } from '../selectors';
import { store } from '../Stores/store';

/* ------------------------------------------------------------------------- *
 * Re-exports
 *
 * The edition state itself now lives in store/slices/edition. These keep the
 * existing import sites working; new code should import from the slice.
 * ------------------------------------------------------------------------- */

export type {
  Edition,
  EditionSliceState,
  EditionState,
  FileEdition,
  VariableCreateEdition,
  VariableEdition,
} from '../../store/slices/edition';
export {
  closeEditor,
  discardUnsavedChanges,
  isEditingVariable,
} from '../../store/slices/edition';

/* ------------------------------------------------------------------------- *
 * Thunks
 *
 * They live here rather than in the slice because they reach into
 * VariableDescriptorActions, which imports the store back.
 * ------------------------------------------------------------------------- */

/**
 * Edit VariableDescriptor
 * @param entity
 * @param path
 * @param config
 */
export function editVariable(
  entity: IVariableDescriptor,
  path: (string | number)[] = [],
  config?: Schema<AvailableViews>,
): AppThunk {
  return function (scopedDispatch) {
    scopedDispatch(variableEdit({ entity, config, path }));
  };
}

export function deleteState<T extends IFSMDescriptor | IDialogueDescriptor>(
  stateMachine: Immutable<T>,
  index: number,
): AppThunk {
  return function (scopedDispatch) {
    const newStateMachine = produce((stateMachine: T) => {
      const { states } = stateMachine;

      delete states[index];
      // delete transitions pointing to deleted state
      for (const s in states) {
        (states[s] as IAbstractState).transitions = (
          states[s].transitions as IAbstractTransition[]
        ).filter(t => t.nextStateId !== index);
      }
    })(stateMachine);

    return scopedDispatch(
      Actions.VariableDescriptorActions.updateDescriptor(newStateMachine),
    );
  };
}

export function deleteTransition<
  T extends IFSMDescriptor | IDialogueDescriptor,
>(
  stateMachine: Immutable<T>,
  stateId: number,
  transitionIndex: number,
): AppThunk {
  return function (scopedDispatch) {
    const newStateMachine = produce((stateMachine: T) => {
      const transitions = stateMachine.states[stateId].transitions;
      transitions.splice(transitionIndex, 1);
    })(stateMachine);

    return scopedDispatch(
      Actions.VariableDescriptorActions.updateDescriptor(newStateMachine),
    );
  };
}

/**
 * Edit StateMachine
 * @param entity
 * @param path
 * @param config
 */
export function editStateMachine(
  entity: Immutable<IAbstractStateMachineDescriptor>,
  path: string[] = [],
  config?: Schema<AvailableViews>,
): AppThunk {
  return function (scopedDispatch) {
    scopedDispatch(fsmEdit({ entity, config, path }));
  };
}

/**
 * Edit File
 * @param entity
 * @param cb
 */
export function editFile(
  entity: IAbstractContentDescriptor,
  cb?: (updatedValue: IAbstractContentDescriptor) => void,
) {
  return fileEdit({ entity, cb });
}

/**
 * Create a variableDescriptor
 *
 * @export
 * @param {string} cls class
 * @returns
 */
export function createVariable(
  cls: IAbstractEntity['@class'],
  parent?:
    | IParentDescriptor
    | IListDescriptor
    | IQuestionDescriptor
    | IChoiceDescriptor
    | IWhQuestionDescriptor
    | IPeerReviewDescriptor,
  subtype?: VariableCreateEdition['subtype'],
) {
  return variableCreate({
    '@class': cls,
    parentId: parent ? parent.id : undefined,
    parentType: parent ? parent['@class'] : undefined,
    subtype,
  });
}

/**
 * Save the content from the editor
 *
 * @export
 * @param {IAbstractEntity} value
 * @returns {AppThunk}
 */
export function saveEditor(
  value: IMergeable,
  selectUpdatedEntity: boolean = true,
  selectPath?: (string | number)[],
): AppThunk {
  return function save(scopedDispatch, getState) {
    scopedDispatch(discardUnsavedChanges());
    const editMode = selectEdition(getState());
    if (editMode == null) {
      return;
    }
    switch (editMode.type) {
      case 'Variable':
      case 'VariableFSM':
        return scopedDispatch(
          ACTIONS.VariableDescriptorActions.updateDescriptor(
            value as IVariableDescriptor,
            selectUpdatedEntity,
            selectPath,
          ),
        );
      case 'VariableCreate':
        return scopedDispatch(
          ACTIONS.VariableDescriptorActions.createDescriptor(
            value as IVariableDescriptor,
            VariableDescriptor.select(editMode.parentId) as
              | IParentDescriptor
              | undefined,
          ),
        );
      case 'File':
        return store.dispatch(() => {
          return FileAPI.updateMetadata(value as IAbstractContentDescriptor)
            .then((res: IAbstractContentDescriptor) => {
              if (selectUpdatedEntity) {
                // the scope that opened the file re-selects it: used to be
                // hard-coded to the global editing store, so a file saved from
                // a nested form re-selected in the main editor
                scopedDispatch(editFile(res));
              }
              editMode.cb && editMode.cb(res);
            })
            .catch((res: Error) => {
              // events are global only, never route them through a local scope
              dispatch(editorErrorEvent(res.message));
            });
        });
    }
  };
}

/* ------------------------------------------------------------------------- *
 * Events
 * ------------------------------------------------------------------------- */

export function editorEvent(anyEvent: WegasEvents[keyof WegasEvents]) {
  const event: WegasEvent = {
    ...anyEvent,
    timestamp: new Date().getTime(),
    unread: true,
  };
  triggerEventHandlers(event);
  return editorEventAdded(event);
}

export function editorErrorEvent(error: string) {
  return editorEvent({ '@class': 'ClientEvent', error });
}

export function editorEventRemove(timestamp: number) {
  return editorEventRemoved({ timestamp });
}

export function editorEventRead(timestamp: number) {
  return editorEventReadAction({ timestamp });
}
