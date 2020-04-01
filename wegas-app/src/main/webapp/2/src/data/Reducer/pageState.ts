import u from 'immer';
import { ActionType, StateActions, ActionCreator } from '../actions';
import { PageAPI } from '../../API/pages.api';
import { ThunkResult } from '../store';
import { Reducer } from 'redux';
import { Page } from '../selectors';
import { compare } from 'fast-json-patch';
import { getItemFromPath, isPageItem } from '../../Helper/pages';

export type PageState = Readonly<AllPages>;

const pageState: Reducer<PageState> = u(
  (state: PageState, action: StateActions) => {
    switch (action.type) {
      case ActionType.PAGE_FETCH:
        return { ...state, ...action.payload.pages };
      case ActionType.PAGE_INDEX:
        return { ...state, ...action.payload } as PageState;
    }
  },
  {},
);
export default pageState;

// Actions

export function getDefault(): ThunkResult {
  return function(dispatch) {
    return PageAPI.getDefault()
      .then(pages => dispatch(ActionCreator.PAGE_FETCH({ pages })))
      .catch((res: Response) =>
        dispatch(ActionCreator.PAGE_ERROR({ error: res.statusText })),
      );
  };
}
export function setDefault(pageId: string): ThunkResult {
  return function(dispatch) {
    return PageAPI.setDefaultPage(pageId)
      .then(index => dispatch(ActionCreator.PAGE_INDEX({ index })))
      .catch((res: Response) =>
        dispatch(ActionCreator.PAGE_ERROR({ error: res.statusText })),
      );
  };
}
export function get(id: string): ThunkResult {
  return function(dispatch) {
    return PageAPI.get(id)
      .then(pages => dispatch(ActionCreator.PAGE_FETCH({ pages })))
      .catch((res: Response) =>
        dispatch(ActionCreator.PAGE_ERROR({ error: res.statusText })),
      );
  };
}
export function getAll(): ThunkResult {
  return function(dispatch) {
    // Getting the index to force building it in case of old scenario
    return PageAPI.getIndex()
      .then(index => {
        dispatch(ActionCreator.PAGE_INDEX({ index }));
        return PageAPI.getAll().then(pages =>
          dispatch(ActionCreator.PAGE_FETCH({ pages })),
        );
      })
      .catch((res: Response) =>
        dispatch(ActionCreator.PAGE_ERROR({ error: res.statusText })),
      );
  };
}

export function createItem(
  folderPath: string[],
  newItem: PageIndexItem,
  pageContent?: WegasComponent,
): ThunkResult {
  return function(dispatch) {
    return PageAPI.newIndexItem(folderPath, newItem, pageContent)
      .then(index => {
        const item = getItemFromPath(index, [...folderPath, newItem.name]);
        if (isPageItem(item)) {
          dispatch(get(item.id!));
        }
        return dispatch(ActionCreator.PAGE_INDEX({ index }));
      })
      .catch((res: Response) => {
        return dispatch(ActionCreator.PAGE_ERROR({ error: res.statusText }));
      });
  };
}

export function deleteIndexItem(itemPath: string[]): ThunkResult {
  return function(dispatch) {
    return PageAPI.deleteIndexItem(itemPath)
      .then(index => dispatch(ActionCreator.PAGE_INDEX({ index })))
      .catch((res: Response) =>
        dispatch(ActionCreator.PAGE_ERROR({ error: res.statusText })),
      );
  };
}

export function updateIndexItem(
  itemPath: string[],
  item: PageIndexItem,
): ThunkResult {
  return function(dispatch) {
    return PageAPI.updateIndexItem(itemPath, item)
      .then(index => dispatch(ActionCreator.PAGE_INDEX({ index })))
      .catch((res: Response) =>
        dispatch(ActionCreator.PAGE_ERROR({ error: res.statusText })),
      );
  };
}

export function moveIndexItem(
  itemPath: string[],
  folderPath: string[],
  pos?: number,
): ThunkResult {
  return function(dispatch) {
    return PageAPI.moveIndexItem(itemPath, folderPath, pos)
      .then(index => dispatch(ActionCreator.PAGE_INDEX({ index })))
      .catch((res: Response) =>
        dispatch(ActionCreator.PAGE_ERROR({ error: res.statusText })),
      );
  };
}

export function deletePage(id: string): ThunkResult {
  return function(dispatch) {
    return PageAPI.deletePage(id)
      .then(index => dispatch(ActionCreator.PAGE_INDEX({ index })))
      .catch((res: Response) =>
        dispatch(ActionCreator.PAGE_ERROR({ error: res.statusText })),
      );
  };
}

function patcher(
  id: string,
  page: WegasComponent,
  callbackFN: (
    status:
      | { type: 'PAGE_NOT_FOUND' }
      | { type: 'API_ERROR'; res: Response }
      | { type: 'PATCH_WORKED'; pages: Pages },
  ) => void,
) {
  const oldPage = Page.select(id);
  if (oldPage === undefined) {
    return callbackFN({ type: 'PAGE_NOT_FOUND' });
  }
  const diff = compare(oldPage, page);
  return PageAPI.patch(JSON.stringify(diff), id, true)
    .then(pages => callbackFN({ type: 'PATCH_WORKED', pages }))
    .catch((res: Response) => callbackFN({ type: 'API_ERROR', res }));
}

export function patch(id: string, page: WegasComponent): ThunkResult {
  return function(dispatch) {
    return patcher(id, page, response => {
      switch (response.type) {
        case 'PAGE_NOT_FOUND':
          return dispatch(
            ActionCreator.PAGE_ERROR({ error: `Page ${id} not found` }),
          );
        case 'PATCH_WORKED':
          return dispatch(ActionCreator.PAGE_FETCH({ pages: response.pages }));
        case 'API_ERROR':
          return dispatch(
            ActionCreator.PAGE_ERROR({ error: response.res.statusText }),
          );
      }
    });
    //   const oldPage = Page.select(id);
    //   if (oldPage === undefined) {
    //   return dispatch(
    //     ActionCreator.PAGE_ERROR({ error: `Page ${id} not found` }),
    //   );
    // }
    //   const diff = compare(oldPage, page);
    //   return PageAPI.patch(JSON.stringify(diff), id, true)
    //     .then(pages => dispatch(ActionCreator.PAGE_FETCH({ pages })))
    //     .catch((res: Response) =>
    //       dispatch(ActionCreator.PAGE_ERROR({ error: res.statusText })),
    //     );
    // };
  };

  /**
   * It's basicly a synchronize double patch to avoid page commit failure
   */
  // export function moveComponent(
  //   sourcePageId: string,
  //   destPageId: string,
  //   sourcePage: WegasComponent,
  //   destPage: WegasComponent,
  // ): ThunkResult {
  //   return function(dispatch) {
  //     const oldPage = Page.select(id);
  //     if (oldPage === undefined) {
  //       return dispatch(
  //         ActionCreator.PAGE_ERROR({ error: `Page ${id} not found` }),
  //       );
  //     }
  //     const diff = compare(oldPage, page);
  //     return PageAPI.patch(JSON.stringify(diff), id, true)
  //       .then(pages => dispatch(ActionCreator.PAGE_FETCH({ pages })))
  //       .catch((res: Response) =>
  //         dispatch(ActionCreator.PAGE_ERROR({ error: res.statusText })),
  //       );

  //     const { component } = findComponent(sourcePage, sourcePath);
  //     if (component) {
  //       dispatc;
  //       createComponent(
  //         destPageId,
  //         destPage,
  //         destPath,
  //         component.type,
  //         component.props,
  //       );
  //       deleteComponent(sourcePageId, sourcePage, sourcePath);
  //     }
  //   };
}
