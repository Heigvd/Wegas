import { FocusedComponent } from '../../Editor/Components/Page/PageEditor';
import { createStore, applyMiddleware, Reducer } from 'redux';
import { composeEnhancers } from './store';
import thunk, { ThunkMiddleware } from 'redux-thunk';
import { createStoreConnector } from '../connectStore';
import u from 'immer';

const pagesActionCreator = {
  COMPONENT_SET_FOCUSED: (data?: FocusedComponent) => ({
    type: 'COMPONENT_SET_FOCUSED',
    payload: data,
  }),
};

type PagesActions<
  A extends keyof typeof pagesActionCreator = keyof typeof pagesActionCreator
> = ReturnType<typeof pagesActionCreator[A]>;

export const PageStateAction = {
  setFocused: (pageId: string, componentPath: number[]) =>
    pagesActionCreator.COMPONENT_SET_FOCUSED({ pageId, componentPath }),
  unsetFocused: () => pagesActionCreator.COMPONENT_SET_FOCUSED(undefined),
};

interface PagesState {
  focusedComponent?: FocusedComponent;
}

const pagesStateReducer: Reducer<Readonly<PagesState>> = u(
  (state: PagesState, action: PagesActions) => {
    switch (action.type) {
      case 'COMPONENT_SET_FOCUSED': {
        return { focusedComponent: action.payload };
      }
    }
    return state;
  },
  { focusedComponent: undefined },
);

export const pagesStateStore = createStore(
  pagesStateReducer,
  composeEnhancers(
    applyMiddleware(thunk as ThunkMiddleware<PagesState, PagesActions>),
  ),
);

export const { useStore: usePagesStateStore } = createStoreConnector(
  pagesStateStore,
);

export function isComponentFocused(
  editMode: boolean,
  pageId: string,
  componentPath: number[],
) {
  return ({ focusedComponent }: PagesState) =>
    (editMode &&
      focusedComponent &&
      focusedComponent.pageId === pageId &&
      JSON.stringify(focusedComponent.componentPath) ===
        JSON.stringify(componentPath)) === true;
}
