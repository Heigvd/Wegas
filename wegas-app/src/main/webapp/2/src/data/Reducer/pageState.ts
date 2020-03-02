import u from 'immer';
import { ActionType, StateActions, ActionCreator } from '../actions';
import { PageAPI } from '../../API/pages.api';
import { ThunkResult } from '../store';
import { Reducer } from 'redux';

// export interface PageState {
//   [id: string]: Readonly<AllPages>;
// }

export type PageState = Readonly<AllPages>;

const pageState: Reducer<Readonly<PageState>> = u(
  (state: PageState, action: StateActions) => {
    switch (action.type) {
      case ActionType.PAGE_FETCH:
        return { ...state, ...action.payload.pages };
      // case ActionType.PAGE_INDEX:
      //   return {...state, ...action.payload};
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
  id: string,
): ThunkResult<Promise<StateActions<'PAGE_FETCH'>>> {
  return function(dispatch, getState) {
    const gameModelId = getState().global.currentGameModelId;
    return PageAPI.get(gameModelId, id).then(pages =>
      dispatch(ActionCreator.PAGE_FETCH({ pages })),
    );
  };
}
export function getAll(): ThunkResult<Promise<StateActions<'PAGE_FETCH'>>> {
  return function(dispatch, getState) {
    const gameModelId = getState().global.currentGameModelId;
    return PageAPI.getAll(gameModelId).then(pages =>
      dispatch(ActionCreator.PAGE_FETCH({ pages })),
    );
  };
}
export function createPage(
  folderPath: string[],
  newItem: PageIndexItem,
  pageContent?: WegasComponent,
): ThunkResult<Promise<StateActions<'PAGE_FETCH'>>> {
  return function(dispatch, getState) {
    const gameModelId = getState().global.currentGameModelId;
    return PageAPI.newIndexItem(
      gameModelId,
      folderPath,
      newItem,
      pageContent,
    ).then(pages => dispatch(ActionCreator.PAGE_FETCH({ pages })));
  };
}
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
// export function patch(
//   id: string,
//   page: Page,
// ): ThunkResult<Promise<StateActions<'PAGE_FETCH'>>> {
//   return function(dispatch, getState) {
//     const gameModelId = getState().global.currentGameModelId;
//     const oldPage = Page.select(id);
//     if (oldPage === undefined) {
//       return Promise.resolve(ActionCreator.PAGE_FETCH({ pages: {} }));
//     }
//     const diff = compare(oldPage, page);
//     // Handle moving a page differently
//     const moving = diff.findIndex(
//       op => op.path === '/@index' && op.op === 'replace',
//     );
//     let movOp: ReplaceOperation<number> | undefined;
//     if (moving > -1) {
//       movOp = diff.splice(moving, 1)[0] as ReplaceOperation<number>;
//     }
//     if (diff.length > 0) {
//       return PageAPI.patch(gameModelId, JSON.stringify(diff), id).then(
//         pages => {
//           const ret = dispatch(ActionCreator.PAGE_FETCH({ pages }));
//           if (movOp !== undefined) {
//             PageAPI.move(gameModelId, movOp.value, id).then(index => {
//               dispatch(ActionCreator.PAGE_INDEX(index));
//             });
//           }
//           return ret;
//         },
//       );
//     } else if (movOp !== undefined) {
//       PageAPI.move(gameModelId, movOp.value, id).then(index => {
//         dispatch(ActionCreator.PAGE_INDEX(index));
//       });
//     }
//     return Promise.resolve(ActionCreator.PAGE_FETCH({ pages: {} }));
//   };
// }
