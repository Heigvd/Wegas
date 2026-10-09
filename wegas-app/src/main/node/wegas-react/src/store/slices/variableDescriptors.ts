/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { produce } from 'immer';
import { isMatch } from 'lodash-es';
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
import { manageResponseHandler } from '../managedResponse';
import { entityIs, varIsList } from '../../data/entities';
import { deleteState, editVariable } from '../editionThunks';
import { selectCurrentGame } from './game';
import { selectCurrentPlayer } from './players';
import { deepRemove } from '../../data/updateUtils';
import { runEffects, unmountEffects } from '../../Helper/pageEffectsManager';
import { managedResponseReceived } from '../actions';
import { AppThunk, RootState, store } from '../store';
import { selectEdition } from './edition';
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
): AppThunk<Promise<void>> {
  return function (dispatch, getState) {
    const gameModelId = currentGameModelId();
    return VariableDescriptorAPI.update(gameModelId, variableDescriptor).then(
      res => {
        manageResponseHandler(
          res,
          dispatch,
          selectEdition(getState()),
          selectUpdatedEntity,
          selectPath,
        );
      },
    );
  };
}

export function duplicateDescriptor(
  variableDescriptor: IVariableDescriptor,
  path?: (number | string)[],
): AppThunk<Promise<void>> {
  if (path == null || path.length === 0) {
    return function (dispatch, getState) {
      return VariableDescriptorAPI.duplicate(
        currentGameModelId(),
        variableDescriptor,
      ).then(res =>
        manageResponseHandler(res, dispatch, selectEdition(getState())),
      );
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
): AppThunk {
  return function (dispatch, getState) {
    const gameModelId = currentGameModelId();
    return VariableDescriptorAPI.move(
      gameModelId,
      variableDescriptor,
      index,
      parent,
    ).then(res => {
      return manageResponseHandler(res, dispatch, selectEdition(getState()));
    });
  };
}

export function createDescriptor(
  variableDescriptor: IVariableDescriptor,
  parent?: IParentDescriptor,
): AppThunk {
  return function (dispatch, getState) {
    const gameModelId = currentGameModelId();
    return VariableDescriptorAPI.post(
      gameModelId,
      variableDescriptor,
      parent,
    ).then(res => {
      manageResponseHandler(res, dispatch, selectEdition(getState()));
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
): AppThunk {
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
      res =>
        manageResponseHandler(res, dispatch, selectEdition(getState())),
    );
  };
}

export function reset(): AppThunk {
  return function (dispatch, getState) {
    const gameModelId = currentGameModelId();
    return VariableDescriptorAPI.reset(gameModelId).then(res => {
      const r = manageResponseHandler(res, dispatch, selectEdition(getState()));
      // unmount and remount effects
      unmountEffects();
      runEffects();
      return r;
    });
  };
}

export function getByIds(ids: number[]): AppThunk {
  return function (dispatch, getState) {
    const gameModelId = currentGameModelId();
    return VariableDescriptorAPI.getByIds(ids, gameModelId).then(res =>
      manageResponseHandler(res, dispatch, selectEdition(getState())),
    );
  };
}

export function setPRState(
  peerReviewId: number,
  state: PeerReviewStateSelector,
): AppThunk {
  return function (dispatch, getState) {
    return PeerReviewDescriptorAPI.setState(
      currentGameModelId(),
      peerReviewId,
      selectCurrentGame().id!,
      state,
    ).then(res =>
      manageResponseHandler(res, dispatch, selectEdition(getState())),
    );
  };
}

export function submitToReview(peerReviewId: number): AppThunk {
  return function (dispatch, getState) {
    return PeerReviewDescriptorAPI.submitToReview(
      currentGameModelId(),
      peerReviewId,
      selectCurrentPlayer().id!,
    ).then(res =>
      manageResponseHandler(res, dispatch, selectEdition(getState())),
    );
  };
}

export function asynchSaveReview(review: IReview) {
  return PeerReviewDescriptorAPI.saveReview(
    currentGameModelId(),
    selectCurrentPlayer().id!,
    review,
  );
}

export function saveReview(review: IReview): AppThunk {
  return function (dispatch, getState) {
    return asynchSaveReview(review).then(res =>
      manageResponseHandler(res, dispatch, selectEdition(getState())),
    );
  };
}

export function submitReview(review: IReview, cb?: () => void): AppThunk {
  return function (dispatch, getState) {
    return PeerReviewDescriptorAPI.submitReview(
      currentGameModelId(),
      selectCurrentPlayer().id!,
      review,
    ).then(res => {
      manageResponseHandler(res, dispatch, selectEdition(getState()));
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

/* ------------------------------------------------------------------ *
 * Selectors
 *
 * Dual-use: called without a state they read the store synchronously
 * (imperative callers, client scripts); passed a state they are plain
 * selectors, usable in useAppSelector.
 * ------------------------------------------------------------------ */

/**
 * The variableDescriptor with this id, or the list of them for a list of ids.
 */
export function selectDescriptor<
  T extends IVariableDescriptor = IVariableDescriptor,
>(id?: number | null, state?: RootState): Readonly<T> | undefined;
export function selectDescriptor<
  T extends IVariableDescriptor = IVariableDescriptor,
>(id: number[], state?: RootState): (Readonly<T> | undefined)[];
export function selectDescriptor<
  T extends IVariableDescriptor = IVariableDescriptor,
>(id?: number | number[] | null, state: RootState = store.getState()) {
  if (id == null) {
    return;
  }
  if (Array.isArray(id)) {
    return id.map(i => state.variableDescriptors[i] as T);
  }
  return state.variableDescriptors[id] as T;
}

/**
 * The first variableDescriptor whose `key` equals `value`.
 */
export function firstDescriptor<T extends IVariableDescriptor>(
  key: keyof T,
  value: unknown,
): Readonly<T> | undefined {
  const state = store.getState();
  for (const vd in state.variableDescriptors) {
    const s = state.variableDescriptors[vd] as T;
    if (s && s[key] === value) {
      return s;
    }
  }
}

/**
 * Cache for findDescriptorByName: name -> id
 */
const descriptorNameIdCache = new Map<string, number>();

/**
 * The variableDescriptor with this name. Ids are cached by name for faster
 * subsequent calls.
 */
export function findDescriptorByName<T extends IVariableDescriptor>(
  name?: string,
) {
  if (name === undefined) {
    return undefined;
  }
  const id = descriptorNameIdCache.get(name);
  if (typeof id === 'number') {
    const descriptor = selectDescriptor<T>(id);
    // Check if descriptor still exists and has the right name.
    if (descriptor != null && descriptor.name === name) {
      return descriptor;
    }
    descriptorNameIdCache.delete(name);
  }
  const descriptor = firstDescriptor<T>('name', name);
  if (descriptor != null && descriptor.id != null) {
    descriptorNameIdCache.set(name, descriptor.id!);
  }
  return descriptor;
}

/**
 * The first variableDescriptor matching the shape `o`.
 */
export function firstMatchingDescriptor<T extends IVariableDescriptor>(
  o: Partial<T>,
): Readonly<T> | undefined {
  const state = store.getState();
  for (const vd in state.variableDescriptors) {
    const s = state.variableDescriptors[vd] as T;
    if (isMatch(s, o)) {
      return s;
    }
  }
}

/**
 * Every variableDescriptor whose `key` equals `value`.
 */
export function allDescriptors<T extends IVariableDescriptor>(
  key: keyof T,
  value: unknown,
) {
  const ret = [];
  const state = store.getState();
  for (const vd in state.variableDescriptors) {
    const s = state.variableDescriptors[vd] as T;
    if (s && s[key] === value) {
      ret.push(s);
    }
  }
  return ret;
}

/**
 * The variableDescriptors nested in a parent descriptor, at any depth,
 * optionally only those of the given classes.
 */
export function flattenDescriptors<
  T extends IVariableDescriptor,
  E extends T['@class'][] = T['@class'][],
>(ld: IParentDescriptor | undefined, ...cls: E) {
  if (ld === undefined) {
    return [];
  }
  const ret: T[] = [];
  const state = store.getState();

  ld.itemsIds.forEach(id => {
    const descriptor = state.variableDescriptors[id];
    if (cls.length > 0) {
      if (descriptor !== undefined && cls.includes(descriptor['@class'])) {
        ret.push(descriptor as T);
      }
    } else if (descriptor !== undefined) {
      ret.push(descriptor as T);
    }

    if (varIsList(descriptor)) {
      ret.push(...flattenDescriptors<T, E>(descriptor, ...cls));
    }
  });
  return ret;
}
