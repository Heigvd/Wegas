import u from 'updeep';
import { ActionType, Actions } from '../actions';
import { ThunkAction } from 'redux-thunk';
import { State } from './reducers';
import { PageAPI } from '../../API/pages.api';
import { Page } from '../selectors';
import { compare } from 'fast-json-patch';

export interface PageState {
  [id: string]: Readonly<Page>;
}
(window as any).u = u;
const pageState = (
  state: PageState = u({}, {}),
  action: Actions,
): Readonly<PageState> => {
  switch (action.type) {
    case ActionType.PAGE_FETCH:
      return u(u.map(p => u.constant(p), action.payload.pages), state);
  }
  return state;
};
export default pageState;

// Actions

export function getDefault(): ThunkAction<
  Promise<Actions.PAGE_FETCH>,
  State,
  void
> {
  return function(dispatch, getState) {
    const gameModelId = getState().global.currentGameModelId;
    return PageAPI.getDefault(gameModelId).then(
      pages =>
        dispatch({
          type: ActionType.PAGE_FETCH,
          payload: { pages },
        }) as Actions.PAGE_FETCH,
    );
  };
}
export function get(
  id?: string,
): ThunkAction<Promise<Actions.PAGE_FETCH>, State, void> {
  return function(dispatch, getState) {
    const gameModelId = getState().global.currentGameModelId;
    return PageAPI.get(gameModelId, id).then(
      pages =>
        dispatch({
          type: ActionType.PAGE_FETCH,
          payload: { pages },
        }) as Actions.PAGE_FETCH,
    );
  };
}

export function patch(
  id: string,
  page: Page,
): ThunkAction<Promise<Actions.PAGE_FETCH>, State, void> {
  return function(dispatch, getState) {
    const gameModelId = getState().global.currentGameModelId;
    const oldPage = Page.select(id);
    const diff = compare(oldPage, page);
    if (diff.length > 0) {
      return PageAPI.patch(gameModelId, JSON.stringify(diff), id).then(pages =>
        dispatch({
          type: ActionType.PAGE_FETCH,
          payload: { pages },
        } as Actions.PAGE_FETCH),
      );
    }
    return Promise.resolve(
      dispatch({
        type: ActionType.PAGE_FETCH,
        payload: { pages: {} },
      } as Actions.PAGE_FETCH),
    );
  };
}
