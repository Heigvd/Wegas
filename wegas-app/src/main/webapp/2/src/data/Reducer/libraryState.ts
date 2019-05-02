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
