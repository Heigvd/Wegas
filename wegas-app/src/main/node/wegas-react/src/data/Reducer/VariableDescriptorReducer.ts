import u, { produce } from 'immer';
import { Reducer } from 'redux';
import {
  IReview,
  IVariableDescriptor,
  WegasClassNamesAndClasses,
} from 'wegas-ts-api';
import {
  PeerReviewDescriptorAPI,
  PeerReviewStateSelector,
} from '../../API/peerReview.api';
import { VariableDescriptorAPI } from '../../API/variableDescriptor.api';
import { runEffects, unmountEffects } from '../../Helper/pageEffectsManager';
import { ActionCreator, manageResponseHandler, StateActions } from '../actions';
import { ActionType } from '../actionTypes';
import { entityIs } from '../entities';
import { Game, GameModel, Player } from '../selectors';
import { EditingThunkResult } from '../Stores/editingStore';
import { store, ThunkResult } from '../Stores/store';
import { deepRemove } from '../updateUtils';
import { deleteState, editVariable } from './editingState';

export type VariableDescriptorState = Record<string, Readonly<IVariableDescriptor> | undefined>

// export interface VariableDescriptorState {
//   [id: string]: Readonly<IVariableDescriptor> | undefined;
// }

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
  return function (dispatch) {
    const gameModelId = store.getState().global.currentGameModelId;
    return VariableDescriptorAPI.getAll(gameModelId).then(res => {
      const result = dispatch(manageResponseHandler(res));
      dispatch(ActionCreator.INIT_STATE_SET('variables', true));
      return result;
    });
  };
}

export function updateDescriptor(
  variableDescriptor: IVariableDescriptor,
  selectUpdatedEntity: boolean = true,
  selectPath?: (string | number)[],
): EditingThunkResult<Promise<StateActions | void>> {
  return function (dispatch, getState) {
    const gameModelId = store.getState().global.currentGameModelId;
    return VariableDescriptorAPI.update(gameModelId, variableDescriptor).then(
      res => {
        dispatch(
          manageResponseHandler(
            res,
            dispatch,
            getState(),
            selectUpdatedEntity,
            selectPath,
          ),
        );
      },
    );
  };
}
export function duplicateDescriptor(
  variableDescriptor: IVariableDescriptor,
  path?: (number | string)[],
): EditingThunkResult<Promise<StateActions | void>> {
  const gameModelId = store.getState().global.currentGameModelId;
  if (path == null || path.length === 0) {
    return function (dispatch, getState) {
      return VariableDescriptorAPI.duplicate(
        gameModelId,
        variableDescriptor,
      ).then(res => dispatch(manageResponseHandler(res, dispatch, getState())));
    };
  } else {
    const newEntity = produce(variableDescriptor, v => {
      const newPath = [...path];
      let value: any = v;
      while (newPath.length > 1) {
        const attr = newPath.splice(0, 1)[0];
        value = value[attr];
      }

      const valToCopy = value[newPath[0]];
      let newIndex = Number(newPath[0]) + 1;
      while (value[newIndex] != null) {
        newIndex += 1;
      }

      const newVal = produce(
        valToCopy,
        (
          val: ValueOf<WegasClassNamesAndClasses> & {
            id: number | undefined;
            name: string | undefined;
            refId: string | undefined;
          },
        ) => {
          if (
            entityIs(val, 'State') ||
            entityIs(val, 'DialogueState') ||
            entityIs(val, 'Transition') ||
            entityIs(val, 'DialogueTransition')
          ) {
            val.index = newIndex;
            if (entityIs(val, 'State') || entityIs(val, 'DialogueState')) {
              val.x = val.x + 25;
              val.y = val.y + 25;
              val.transitions = [];
            }
          }

          val.id = undefined;
          val.name = undefined;
          val.refId = undefined;
        },
      );

      value[newIndex] = newVal;
    });

    return updateDescriptor(newEntity, true, [
      ...path.slice(0, -1),
      Number(path.slice(-1)[0]) + 1,
    ]);
  }
}

export function moveDescriptor(
  variableDescriptor: IVariableDescriptor,
  index: number,
  parent?: IParentDescriptor,
): EditingThunkResult {
  return function (dispatch, getState) {
    const gameModelId = store.getState().global.currentGameModelId;
    return VariableDescriptorAPI.move(
      gameModelId,
      variableDescriptor,
      index,
      parent,
    ).then(res => {
      return dispatch(manageResponseHandler(res, dispatch, getState()));
    });
  };
}
export function createDescriptor(
  variableDescriptor: IVariableDescriptor,
  parent?: IParentDescriptor,
): EditingThunkResult {
  return function (dispatch, getState) {
    const gameModelId = store.getState().global.currentGameModelId;
    return VariableDescriptorAPI.post(
      gameModelId,
      variableDescriptor,
      parent,
    ).then(res => {
      dispatch(manageResponseHandler(res, dispatch, getState()));
      // Assume entity[0] is what we just created.
      return dispatch(
        editVariable(res.updatedEntities[0] as IVariableDescriptor),
      );
    });
  };
}
export function deleteDescriptor(
  variableDescriptor: IVariableDescriptor,
  path: string[] = [],
): EditingThunkResult {
  return function (dispatch, getState) {
    if (path.length > 0) {
      // Manage state deletion specificaly
      if (
        path.length === 2 &&
        (entityIs(variableDescriptor, 'FSMDescriptor') ||
          entityIs(variableDescriptor, 'DialogueDescriptor'))
      ) {
        return dispatch(deleteState(variableDescriptor, Number(path[1])));
      }
      const vs = deepRemove(variableDescriptor, path) as IVariableDescriptor;
      return dispatch(updateDescriptor(vs));
    }
    const gameModelId = store.getState().global.currentGameModelId;
    return VariableDescriptorAPI.delete(gameModelId, variableDescriptor).then(
      res => dispatch(manageResponseHandler(res, dispatch, getState())),
    );
  };
}

export function reset(): EditingThunkResult {
  return function (dispatch, getState) {
    const gameModelId = store.getState().global.currentGameModelId;
    return VariableDescriptorAPI.reset(gameModelId).then(res => {
      const r = dispatch(manageResponseHandler(res, dispatch, getState()));
      // unmount and remount effects
      unmountEffects();
      runEffects();
      return r;
    });
  };
}

export function getByIds(ids: number[]): EditingThunkResult {
  return function (dispatch, getState) {
    const gameModelId = store.getState().global.currentGameModelId;
    return VariableDescriptorAPI.getByIds(ids, gameModelId).then(res =>
      dispatch(manageResponseHandler(res, dispatch, getState())),
    );
  };
}

export function setPRState(
  peerReviewId: number,
  state: PeerReviewStateSelector,
): EditingThunkResult {
  return function (dispatch, getState) {
    return PeerReviewDescriptorAPI.setState(
      GameModel.selectCurrent().id!,
      peerReviewId,
      Game.selectCurrent().id!,
      state,
    ).then(res => dispatch(manageResponseHandler(res, dispatch, getState())));
  };
}

export function submitToReview(peerReviewId: number): EditingThunkResult {
  return function (dispatch, getState) {
    return PeerReviewDescriptorAPI.submitToReview(
      GameModel.selectCurrent().id!,
      peerReviewId,
      Player.selectCurrent().id!,
    ).then(res => dispatch(manageResponseHandler(res, dispatch, getState())));
  };
}

export function asynchSaveReview(review: IReview) {
  return PeerReviewDescriptorAPI.saveReview(
    GameModel.selectCurrent().id!,
    Player.selectCurrent().id!,
    review,
  );
}

export function saveReview(review: IReview): EditingThunkResult {
  return function (dispatch, getState) {
    return asynchSaveReview(review).then(res =>
      dispatch(manageResponseHandler(res, dispatch, getState())),
    );
  };
}

export function submitReview(
  review: IReview,
  cb?: () => void,
): EditingThunkResult {
  return function (dispatch, getState) {
    return PeerReviewDescriptorAPI.submitReview(
      GameModel.selectCurrent().id!,
      Player.selectCurrent().id!,
      review,
    ).then(res => {
      dispatch(manageResponseHandler(res, dispatch, getState()));
      cb && cb();
    });
  };
}
