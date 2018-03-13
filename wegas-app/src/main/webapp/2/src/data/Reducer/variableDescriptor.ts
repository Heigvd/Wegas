import { Reducer } from 'redux';
import u from 'updeep';
import { managedMode, Actions, ActionType } from '../actions';
import { ThunkAction } from 'redux-thunk';
import { State } from './reducers';
import { Actions as Act } from '..';
import { VariableDescriptorAPI } from '../../API/variableDescriptor.api';
import { deepRemove } from '../updateUtils';

export interface VariableDescriptorState {
  [id: string]: Readonly<IVariableDescriptor> | undefined;
}

const variableDescriptors: Reducer<
  Readonly<VariableDescriptorState>
> = function variableDescriptors(state = {}, action: Actions) {
  switch (action.type) {
    case ActionType.MANAGED_MODE:
      const updateList = action.payload.updatedEntities.variableDescriptors;
      const deletedIds = Object.keys(
        action.payload.deletedEntities.variableDescriptors,
      );
      // merge in update prev var which have a higher version
      const realUpdate = u.map(
        (variable, i) =>
          u.if(
            variable => {
              const curVar = state[i];
              return !!curVar && curVar.version > variable.version;
            },
            state[i],
            variable,
          ),
        updateList,
      );
      return u.omit(deletedIds, u(realUpdate, state));
  }
  return state;
};
export default variableDescriptors;

//ACTIONS

export function getAll(): ThunkAction<void, State, void> {
  return function(dispatch, getState) {
    const gameModelId = getState().global.currentGameModelId;
    VariableDescriptorAPI.getAll(gameModelId).then(res =>
      dispatch(managedMode(res)),
    );
  };
}

export function updateDescriptor(
  variableDescriptor: IVariableDescriptor,
): ThunkAction<void, State, void> {
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
): ThunkAction<void, State, void> {
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
): ThunkAction<void, State, void> {
  return function(dispatch, getState) {
    const gameModelId = getState().global.currentGameModelId;
    return VariableDescriptorAPI.post(
      gameModelId,
      variableDescriptor,
      parent,
    ).then(res => {
      dispatch(managedMode(res));
      // Assume entity[0] is what we just created.
      dispatch(
        Act.EditorActions.editVariable(res
          .updatedEntities[0] as IVariableDescriptor),
      );
    });
  };
}
export function deleteDescriptor(
  variableDescriptor: IVariableDescriptor,
  path: string[] = [],
): ThunkAction<void, State, void> {
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
