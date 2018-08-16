import { Reducer } from 'redux';
import u from 'immer';
import { managedMode, StateActions, ActionType } from '../actions';
import { Actions as Act } from '..';
import { VariableDescriptorAPI } from '../../API/variableDescriptor.api';
import { deepRemove } from '../updateUtils';
import { ThunkResult } from '../store';

export interface VariableDescriptorState {
  [id: string]: Readonly<IVariableDescriptor> | undefined;
}

const variableDescriptors: Reducer<Readonly<VariableDescriptorState>> = u(
  function variableDescriptors(
    state: VariableDescriptorState,
    action: StateActions,
  ) {
    switch (action.type) {
      case ActionType.MANAGED_MODE:
        const updateList = action.payload.updatedEntities.variableDescriptors;
        const deletedIds = Object.keys(
          action.payload.deletedEntities.variableDescriptors,
        );
        Object.keys(updateList).forEach(id => {
          const newElement = updateList[id];
          const oldElement = state[id];
          // merge in update prev var which have a higher version
          if (oldElement == null || newElement.version >= oldElement.version) {
            state[id] = newElement;
          }
        });
        deletedIds.forEach(id => {
          delete state[id];
        });

        return;
    }
  },
  {},
);
export default variableDescriptors;

//ACTIONS

export function getAll(): ThunkResult {
  return function(dispatch, getState) {
    const gameModelId = getState().global.currentGameModelId;
    return VariableDescriptorAPI.getAll(gameModelId).then(res =>
      dispatch(managedMode(res)),
    );
  };
}

export function updateDescriptor(
  variableDescriptor: IVariableDescriptor,
): ThunkResult<Promise<StateActions>> {
  return function(dispatch, getState) {
    const gameModelId = getState().global.currentGameModelId;
    return VariableDescriptorAPI.update(gameModelId, variableDescriptor).then(
      res => dispatch(managedMode(res)),
    );
  };
}
export function moveDescriptor(
  variableDescriptor: IVariableDescriptor,
  index: number,
  parent?: IParentDescriptor,
): ThunkResult {
  return function(dispatch, getState) {
    const gameModelId = getState().global.currentGameModelId;
    return VariableDescriptorAPI.move(
      gameModelId,
      variableDescriptor,
      index,
      parent,
    ).then(res => dispatch(managedMode(res)));
  };
}
export function createDescriptor(
  variableDescriptor: IVariableDescriptor,
  parent?: IParentDescriptor,
): ThunkResult {
  return function(dispatch, getState) {
    const gameModelId = getState().global.currentGameModelId;
    return VariableDescriptorAPI.post(
      gameModelId,
      variableDescriptor,
      parent,
    ).then(res => {
      dispatch(managedMode(res));
      // Assume entity[0] is what we just created.
      return dispatch(
        Act.EditorActions.editVariable(res
          .updatedEntities[0] as IVariableDescriptor),
      );
    });
  };
}
export function deleteDescriptor(
  variableDescriptor: IVariableDescriptor,
  path: string[] = [],
): ThunkResult {
  return function(dispatch, getState) {
    if (path.length > 0) {
      let vs = deepRemove(variableDescriptor, path);
      return dispatch(updateDescriptor(vs));
    }
    const gameModelId = getState().global.currentGameModelId;
    return VariableDescriptorAPI.del(gameModelId, variableDescriptor).then(
      res => dispatch(managedMode(res)),
    );
  };
}
