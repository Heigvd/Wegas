import u from 'immer';
import { ActionType, StateActions, ActionCreator } from '../actions';
import { ThunkResult } from '../store';
import { Reducer } from 'redux';
import { LibraryApi, LibType } from '../../API/library.api';

export interface LibraryState {
  CSS: {
    [id: string]: Readonly<ILibrary>;
  };
  ClientScript: {
    [id: string]: Readonly<ILibrary>;
  };
  ServerScript: {
    [id: string]: Readonly<ILibrary>;
  };
}

const libraryState: Reducer<Readonly<LibraryState>> = u(
  (state: LibraryState, action: StateActions) => {
    switch (action.type) {
      case ActionType.LIBRARY_CSS_FETCH:
        return { ...state, CSS: { ...state.CSS, ...action.payload.libraries } };
      case ActionType.LIBRARY_CLIENT_FETCH:
        return {
          ...state,
          ClientScript: { ...state.ClientScript, ...action.payload.libraries },
        };
      case ActionType.LIBRARY_SERVER_FETCH:
        return {
          ...state,
          Script: { ...state.ServerScript, ...action.payload.libraries },
        };
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

export function get(
  type: LibType,
  name: string,
): ThunkResult<Promise<StateActions<'LIBRARY_FETCH'>>> {
  return function(dispatch, getState) {
    const gameModelId = getState().global.currentGameModelId;
    return LibraryApi.getLibrary(gameModelId, type, name).then(library => {
      let libraries: ILibraries = {};
      libraries[name] = library;
      return dispatch(ActionCreator.LIBRARY_FETCH(type, { libraries }));
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
