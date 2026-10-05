/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
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
import { FileAPI } from '../API/files.api';
import { VariableDescriptor } from '../data/selectors';
import { AvailableViews } from '../Editor/Components/FormView';
import {
  discardUnsavedChanges,
  fileEdit,
  fsmEdit,
  selectEdition,
  variableCreate,
  VariableCreateEdition,
  variableEdit,
} from './slices/edition';
import { editorErrorEvent } from './slices/editorEvents';
import {
  createDescriptor,
  updateDescriptor,
} from './slices/variableDescriptors';
import { AppThunk, dispatch } from './store';

/**
 * Edition thunks: open entities in the editor and save them.
 *
 * Not in the edition slice because they reach into the variableDescriptors
 * slice, which imports some of them back. A sibling module is safe:
 * store/store.ts does not import it, so nothing cycles through the store.
 *
 * Every thunk dispatches through the `scopedDispatch` it receives, so it runs
 * in the edition scope that dispatched it (main editor or a nested form, see
 * store/localEdition).
 */

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

    return scopedDispatch(updateDescriptor(newStateMachine));
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

    return scopedDispatch(updateDescriptor(newStateMachine));
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
          updateDescriptor(
            value as IVariableDescriptor,
            selectUpdatedEntity,
            selectPath,
          ),
        );
      case 'VariableCreate':
        return scopedDispatch(
          createDescriptor(
            value as IVariableDescriptor,
            VariableDescriptor.select(editMode.parentId) as
              | IParentDescriptor
              | undefined,
          ),
        );
      case 'File':
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
    }
  };
}