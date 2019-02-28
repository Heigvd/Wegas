import u from 'immer';
import { ActionType, StateActions, ActionCreator } from '../actions';
import { PageAPI } from '../../API/pages.api';
import { Page } from '../selectors';
import { compare } from 'fast-json-patch';
import { ThunkResult } from '../store';
import { ReplaceOperation } from 'fast-json-patch/lib/core';

export interface PageState {
  [id: string]: Readonly<Page>;
}

const pageState = u<PageState, [StateActions]>(
  (state: PageState, action: StateActions) => {
    switch (action.type) {
      case ActionType.PAGE_FETCH:
        return { ...state, ...action.payload.pages };
      case ActionType.PAGE_INDEX:
        return action.payload.reduce(
          (all, curr) => {
            let page = state[curr.id];
            if (page != null) {
              page = { ...page, '@name': curr.name, '@index': curr.index };
            }
            all[curr.id] = page;
            return all;
          },
          {} as PageState,
        );
    }
  },
  {},
);
export default pageState;

// Actions

export function getDefault(): ThunkResult<Promise<StateActions<'PAGE_FETCH'>>> {
  return function(dispatch, getState) {
    const gameModelId = getState().global.currentGameModelId;
    return PageAPI.getDefault(gameModelId).then(pages =>
      dispatch(ActionCreator.PAGE_FETCH({ pages })),
    );
  };
}
export function get(
  id?: string,
): ThunkResult<Promise<StateActions<'PAGE_FETCH'>>> {
  return function(dispatch, getState) {
    const gameModelId = getState().global.currentGameModelId;
    return PageAPI.get(gameModelId, id).then(pages =>
      dispatch(ActionCreator.PAGE_FETCH({ pages })),
    );
  };
}
export function createPage(
  page: WegasComponent,
): ThunkResult<Promise<StateActions<'PAGE_FETCH'>>> {
  return function(dispatch, getState) {
    const gameModelId = getState().global.currentGameModelId;
    return PageAPI.setPage(gameModelId, page).then(pages =>
      dispatch(ActionCreator.PAGE_FETCH({ pages })),
    );
  };
}
export function deletePage(
  id: string,
): ThunkResult<Promise<StateActions<'PAGE_INDEX'>>> {
  return function(dispatch, getState) {
    const gameModelId = getState().global.currentGameModelId;
    return PageAPI.deletePage(gameModelId, id).then(pages =>
      dispatch(ActionCreator.PAGE_INDEX(pages)),
    );
  };
}
export function patch(
  id: string,
  page: Page,
): ThunkResult<Promise<StateActions<'PAGE_FETCH'>>> {
  return function(dispatch, getState) {
    const gameModelId = getState().global.currentGameModelId;
    const oldPage = Page.select(id);
    if (oldPage === undefined) {
      return Promise.resolve(ActionCreator.PAGE_FETCH({ pages: {} }));
    }
    const diff = compare(oldPage, page);
    // Handle moving a page differently
    const moving = diff.findIndex(
      op => op.path === '/@index' && op.op === 'replace',
    );
    let movOp: ReplaceOperation<number> | undefined;
    if (moving > -1) {
      movOp = diff.splice(moving, 1)[0] as ReplaceOperation<number>;
    }
    if (diff.length > 0) {
      return PageAPI.patch(gameModelId, JSON.stringify(diff), id).then(
        pages => {
          const ret = dispatch(ActionCreator.PAGE_FETCH({ pages }));
          if (movOp !== undefined) {
            PageAPI.move(gameModelId, movOp.value, id).then(index => {
              dispatch(ActionCreator.PAGE_INDEX(index));
            });
          }
          return ret;
        },
      );
    } else if (movOp !== undefined) {
      PageAPI.move(gameModelId, movOp.value, id).then(index => {
        dispatch(ActionCreator.PAGE_INDEX(index));
      });
    }
    return Promise.resolve(ActionCreator.PAGE_FETCH({ pages: {} }));
  };
}
