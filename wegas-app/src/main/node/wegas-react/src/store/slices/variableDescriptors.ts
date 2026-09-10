/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { produce } from 'immer';
import {
  IPeerReviewDescriptor,
  IReview,
  IVariableDescriptor,
  WegasClassNamesAndClasses,
} from 'wegas-ts-api';
import {
  PeerReviewDescriptorAPI,
  PeerReviewStateSelector,
} from '../../API/peerReview.api';
import { VariableDescriptorAPI } from '../../API/variableDescriptor.api';
import { manageResponseHandler, StateActions } from '../../data/actions';
import { entityIs } from '../../data/entities';
import { deleteState, editVariable } from '../../data/Reducer/editingState';
import { Game, Player } from '../../data/selectors';
import { EditingThunkResult } from '../../data/Stores/editingStore';
import { deepRemove } from '../../data/updateUtils';
import { runEffects, unmountEffects } from '../../Helper/pageEffectsManager';
import { managedResponseReceived } from '../actions';
import { RootState, store } from '../store';
import { setInitStatus } from './initStatus';

export type VariableDescriptorState = Record<
  string,
  Readonly<IVariableDescriptor> | undefined
>;

const initialState: VariableDescriptorState = {};

/**
 * The gameModelId every descriptor request is scoped to.
 *
 * Reads the id field, NOT `selectCurrent().id` — the gameModel slice's
 * managedResponseReceived reducer deletes any gameModel named in a delete
 * payload, so the entity can go away while the id cannot.
 */
function currentGameModelId() {
  return store.getState().gameModels.currentGameModelId;
}

/**
 * Fetch every descriptor of the current game model.
 */
export const getAll = createAsyncThunk(
  'variableDescriptors/getAll',
  async (_: void, thunkAPI) => {
    const res = await VariableDescriptorAPI.getAll(currentGameModelId());
    manageResponseHandler(res);
    thunkAPI.dispatch(setInitStatus({ key: 'variables', status: true }));
  },
);

export function updateDescriptor(
  variableDescriptor: IVariableDescriptor,
  selectUpdatedEntity: boolean = true,
  selectPath?: (string | number)[],
): EditingThunkResult<Promise<StateActions | void>> {
  return function (dispatch, getState) {
    const gameModelId = currentGameModelId();
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
  if (path == null || path.length === 0) {
    return function (dispatch, getState) {
      return VariableDescriptorAPI.duplicate(
        currentGameModelId(),
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
    const gameModelId = currentGameModelId();
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
    const gameModelId = currentGameModelId();
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
    const gameModelId = currentGameModelId();
    return VariableDescriptorAPI.delete(gameModelId, variableDescriptor).then(
      res => dispatch(manageResponseHandler(res, dispatch, getState())),
    );
  };
}

export function reset(): EditingThunkResult {
  return function (dispatch, getState) {
    const gameModelId = currentGameModelId();
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
    const gameModelId = currentGameModelId();
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
      currentGameModelId(),
      peerReviewId,
      Game.selectCurrent().id!,
      state,
    ).then(res => dispatch(manageResponseHandler(res, dispatch, getState())));
  };
}

export function submitToReview(peerReviewId: number): EditingThunkResult {
  return function (dispatch, getState) {
    return PeerReviewDescriptorAPI.submitToReview(
      currentGameModelId(),
      peerReviewId,
      Player.selectCurrent().id!,
    ).then(res => dispatch(manageResponseHandler(res, dispatch, getState())));
  };
}

export function asynchSaveReview(review: IReview) {
  return PeerReviewDescriptorAPI.saveReview(
    currentGameModelId(),
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
      currentGameModelId(),
      Player.selectCurrent().id!,
      review,
    ).then(res => {
      dispatch(manageResponseHandler(res, dispatch, getState()));
      cb && cb();
    });
  };
}

/**
 * Every PeerReviewDescriptor of the game model
 */
export function selectPeerReviewDescriptors(state: RootState) {
  return Object.values(state.variableDescriptors).filter(descriptor =>
    entityIs(descriptor, 'PeerReviewDescriptor'),
  ) as IPeerReviewDescriptor[];
}

/**
 * Every descriptor's @class and id, keyed by descriptor name. Feeds the
 * generated `VariableClasses` typings in useGlobalLibs
 */
export function selectVariableClasses(state: RootState) {
  return Object.values(state.variableDescriptors).reduce<{
    [variable: string]: { class: string; id: number };
  }>((newObject, variable) => {
    if (variable !== undefined && variable.name !== undefined) {
      newObject[variable.name] = {
        class: variable['@class'],
        id: variable.id!,
      };
    }
    return newObject;
  }, {});
}

const variableDescriptorsSlice = createSlice({
  name: 'variableDescriptors',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder.addCase(managedResponseReceived, (state, action) => {
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
    });
  },
});

export default variableDescriptorsSlice.reducer;
