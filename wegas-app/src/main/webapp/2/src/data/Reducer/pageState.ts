import u from 'immer';
import { ActionType, Actions, ActionCreator } from '../actions';
import { ThunkAction } from 'redux-thunk';
import { State } from './reducers';
import { PageAPI } from '../../API/pages.api';
import { Page } from '../selectors';
import { compare } from 'fast-json-patch';

export interface PageState {
  [id: string]: Readonly<Page>;
}
const pageState = u<PageState>((state: PageState, action: Actions) => {
  switch (action.type) {
    case ActionType.PAGE_FETCH:
      return { ...state, ...action.payload.pages };
  }
}, {});
export default pageState;

// Actions

export function getDefault(): ThunkAction<Promise<Actions>, State, void> {
  return function(dispatch, getState) {
    const gameModelId = getState().global.currentGameModelId;
    return PageAPI.getDefault(gameModelId).then(pages =>
      dispatch(ActionCreator.PAGE_FETCH({ pages })),
    );
  };
}
export function get(id?: string): ThunkAction<Promise<Actions>, State, void> {
  return function(dispatch, getState) {
    const gameModelId = getState().global.currentGameModelId;
    return PageAPI.get(gameModelId, id).then(pages =>
      dispatch(ActionCreator.PAGE_FETCH({ pages })),
    );
  };
}

export function patch(
  id: string,
  page: Page,
): ThunkAction<Promise<Actions>, State, void> {
  return function(dispatch, getState) {
    const gameModelId = getState().global.currentGameModelId;
    const oldPage = Page.select(id);
    const diff = compare(oldPage, page);
    if (diff.length > 0) {
      return PageAPI.patch(gameModelId, JSON.stringify(diff), id).then(pages =>
        dispatch(ActionCreator.PAGE_FETCH({ pages })),
      );
    }
    return Promise.resolve(dispatch(ActionCreator.PAGE_FETCH({ pages: {} })));
  };
}
