import { Reducer } from 'redux';
import u from 'immer';
import { ActionType, StateActions, managedMode } from '../actions';
import { VariableInstanceAPI } from '../../API/variableInstance.api';
import { ThunkResult } from '../store';

export interface VariableInstanceState {
  [id: string]: Readonly<IVariableInstance> | undefined;
}

const variableInstances: Reducer<Readonly<VariableInstanceState>> = u(
  function variableInstances(
    state: VariableInstanceState,
    action: StateActions,
  ) {
    switch (action.type) {
      case ActionType.MANAGED_MODE:
        const updateList = action.payload.updatedEntities.variableInstances;
        const deletedIds = Object.keys(
          action.payload.deletedEntities.variableInstances,
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
export default variableInstances;

//ACTIONS

export function getAll(): ThunkResult<Promise<StateActions>> {
  return function(dispatch, getState) {
    const gameModelId = getState().global.currentGameModelId;
    return VariableInstanceAPI.getAll(gameModelId).then(res =>
      dispatch(managedMode(res)),
    );
  };
}
