import { Reducer } from 'redux';
import u from 'updeep';
import { ActionType, Actions, managedMode } from '../actions';
import { ThunkAction } from 'redux-thunk';
import { State } from './reducers';
import { VariableInstanceAPI } from '../../API/variableInstance.api';

export interface VariableInstanceState {
  [id: string]: Readonly<IVariableInstance> | undefined;
}

const variableInstances: Reducer<
  Readonly<VariableInstanceState>
> = function variableInstances(state = {}, action: Actions) {
  switch (action.type) {
    case ActionType.MANAGED_MODE:
      const updateList = action.payload.updatedEntities.variableInstances;
      const deletedIds = Object.keys(
        action.payload.deletedEntities.variableInstances,
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
export default variableInstances;

//ACTIONS

export function getAll(): ThunkAction<void, State, void> {
  return function(dispatch, getState) {
    const gameModelId = getState().global.currentGameModelId;
    VariableInstanceAPI.getAll(gameModelId).then(res =>
      dispatch(managedMode(res)),
    );
  };
}
