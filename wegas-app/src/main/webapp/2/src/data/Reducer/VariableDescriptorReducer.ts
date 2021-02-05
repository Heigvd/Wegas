import { Reducer } from 'redux';
import u from 'immer';
import { manageResponseHandler, StateActions, ActionType } from '../actions';
import { Actions as Act } from '..';
import { VariableDescriptorAPI } from '../../API/variableDescriptor.api';
import { deepRemove } from '../updateUtils';
import { ThunkResult, store } from '../Stores/store';
import { IVariableDescriptor } from 'wegas-ts-api';

export interface VariableDescriptorState {
  [id: string]: Readonly<IVariableDescriptor> | undefined;
}

const variableDescriptors: Reducer<Readonly<VariableDescriptorState>> = u(
  (state: VariableDescriptorState, action: StateActions) => {
    switch (action.type) {
      case ActionType.MANAGED_RESPONSE_ACTION: {
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
    }
  },
  {},
);
export default variableDescriptors;

//ACTIONS

export function getAll(): ThunkResult {
  return function (dispatch, getState) {
    const gameModelId = store.getState().global.currentGameModelId;
    return VariableDescriptorAPI.getAll(gameModelId).then(res => {
      return store.dispatch(
        manageResponseHandler(res, dispatch, getState().global),
      );
    });
  };
}

export function updateDescriptor(
  variableDescriptor: IVariableDescriptor,
  selectUpdatedEntity: boolean = true,
): ThunkResult<Promise<StateActions | void>> {
  return function (dispatch, getState) {
    const gameModelId = store.getState().global.currentGameModelId;
    return VariableDescriptorAPI.update(
      gameModelId,
      variableDescriptor,
    ).then(res =>
      store.dispatch(
        manageResponseHandler(
          res,
          dispatch,
          getState().global,
          selectUpdatedEntity,
        ),
      ),
    );
  };
}
export function duplicateDescriptor(
  variableDescriptor: IVariableDescriptor,
): ThunkResult<Promise<StateActions | void>> {
  return function (dispatch, getState) {
    const gameModelId = store.getState().global.currentGameModelId;
    return VariableDescriptorAPI.duplicate(
      gameModelId,
      variableDescriptor,
    ).then(res =>
      store.dispatch(manageResponseHandler(res, dispatch, getState().global)),
    );
  };
}
export function moveDescriptor(
  variableDescriptor: IVariableDescriptor,
  index: number,
  parent?: IParentDescriptor,
): ThunkResult {
  return function (dispatch, getState) {
    const gameModelId = store.getState().global.currentGameModelId;
    return VariableDescriptorAPI.move(
      gameModelId,
      variableDescriptor,
      index,
      parent,
    ).then(res => {
      return store.dispatch(
        manageResponseHandler(res, dispatch, getState().global),
      );
    });
  };
}
export function createDescriptor(
  variableDescriptor: IVariableDescriptor,
  parent?: IParentDescriptor,
): ThunkResult {
  return function (dispatch, getState) {
    const gameModelId = store.getState().global.currentGameModelId;
    return VariableDescriptorAPI.post(
      gameModelId,
      variableDescriptor,
      parent,
    ).then(res => {
      store.dispatch(manageResponseHandler(res, dispatch, getState().global));
      // Assume entity[0] is what we just created.
      return dispatch(
        Act.EditorActions.editVariable(
          res.updatedEntities[0] as IVariableDescriptor,
          undefined,
          undefined,
          {
            more: {
              duplicate: {
                label: 'duplicate',
                action: (entity: IVariableDescriptor) => {
                  dispatch(duplicateDescriptor(entity));
                },
              },
              delete: {
                label: 'delete',
                action: (entity: IVariableDescriptor, path?: string[]) => {
                  dispatch(deleteDescriptor(entity, path));
                },
              },
            },
          },
        ),
      );
    });
  };
}
export function deleteDescriptor(
  variableDescriptor: IVariableDescriptor,
  path: string[] = [],
): ThunkResult {
  return function (dispatch, getState) {
    if (path.length > 0) {
      const vs = deepRemove(variableDescriptor, path) as IVariableDescriptor;
      return store.dispatch(updateDescriptor(vs));
    }
    const gameModelId = store.getState().global.currentGameModelId;
    return VariableDescriptorAPI.delete(
      gameModelId,
      variableDescriptor,
    ).then(res =>
      store.dispatch(manageResponseHandler(res, dispatch, getState().global)),
    );
  };
}

export function reset(): ThunkResult {
  return function (dispatch, getState) {
    const gameModelId = store.getState().global.currentGameModelId;
    return VariableDescriptorAPI.reset(gameModelId).then(res =>
      store.dispatch(manageResponseHandler(res, dispatch, getState().global)),
    );
  };
}

export function getByIds(ids: number[]): ThunkResult {
  return function (dispatch, getState) {
    const gameModelId = store.getState().global.currentGameModelId;
    return VariableDescriptorAPI.getByIds(ids, gameModelId).then(res =>
      store.dispatch(manageResponseHandler(res, dispatch, getState().global)),
    );
  };
}
