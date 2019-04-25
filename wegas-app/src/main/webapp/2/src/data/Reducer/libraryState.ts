import u from 'immer';
import { ActionType, StateActions, ActionCreator } from '../actions';
import { PageAPI } from '../../API/pages.api';
import { Page } from '../selectors';
import { compare } from 'fast-json-patch';
import { ThunkResult } from '../store';
import { ReplaceOperation } from 'fast-json-patch/lib/core';
import { Reducer } from 'redux';
import { LibraryApi, LibType } from '../../API/library.api';

export interface LibraryState {
  [id: string]: Readonly<ILibrary>;
}

const libraryState: Reducer<Readonly<LibraryState>> = u(
  (state: LibraryState, action: StateActions) => {
    switch (action.type) {
      case ActionType.LIBRARY_FETCH:
        return { ...state, ...action.payload.libraries };
      // case ActionType.LIBRARY_INDEX:
      //   return action.payload.reduce(
      //     (all, curr) => {
      //       let library = state[curr.id];
      //       if (library != null) {
      //         page = { ...page, '@name': curr.name, '@index': curr.index };
      //       }
      //       all[curr.id] = page;
      //       return all;
      //     },
      //     {} as PageState,
      //   );
    }
  },
  {},
);
export default libraryState;

// Actions

// export function getDefault(): ThunkResult<Promise<StateActions<'PAGE_FETCH'>>> {
//   return function(dispatch, getState) {
//     const gameModelId = getState().global.currentGameModelId;
//     return PageAPI.getDefault(gameModelId).then(pages =>
//       dispatch(ActionCreator.PAGE_FETCH({ pages })),
//     );
//   };
// }
export function get(
  type: LibType,
  name: string,
): ThunkResult<Promise<StateActions<'LIBRARY_FETCH'>>> {
  return function(dispatch, getState) {
    const gameModelId = getState().global.currentGameModelId;
    console.log(gameModelId, type, name);
    return LibraryApi.getLibrary(gameModelId, type, name).then(libraries => {
      console.log(libraries);
      return dispatch(ActionCreator.LIBRARY_FETCH({ libraries }));
    });
  };
}
// export function createPage(
//   page: WegasComponent,
// ): ThunkResult<Promise<StateActions<'PAGE_FETCH'>>> {
//   return function(dispatch, getState) {
//     const gameModelId = getState().global.currentGameModelId;
//     return PageAPI.setPage(gameModelId, page).then(pages =>
//       dispatch(ActionCreator.PAGE_FETCH({ pages })),
//     );
//   };
// }
// export function deletePage(
//   id: string,
// ): ThunkResult<Promise<StateActions<'PAGE_INDEX'>>> {
//   return function(dispatch, getState) {
//     const gameModelId = getState().global.currentGameModelId;
//     return PageAPI.deletePage(gameModelId, id).then(pages =>
//       dispatch(ActionCreator.PAGE_INDEX(pages)),
//     );
//   };
// }
