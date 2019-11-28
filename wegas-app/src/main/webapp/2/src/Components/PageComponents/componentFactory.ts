import * as React from 'react';
import { createStore, Reducer, applyMiddleware } from 'redux';
import u from 'immer';
import { composeEnhancers } from '../../data/store';
import thunk, { ThunkMiddleware } from 'redux-thunk';
import { useAnyStore } from '../Hooks/storeHookFactory';

export interface PageComponent {
  getComponent: () => React.FunctionComponent<{ [name: string]: unknown }>;
  getSchema: () => SimpleSchema;
  getAllowedVariables: () => (keyof WegasScriptEditorNameAndTypes)[];
  getComputedPropsFromVariable: (
    variable: WegasScriptEditorReturnType,
  ) => { [name: string]: unknown };
}

interface PageComponentsState {
  [name: string]: PageComponent;
}

const PageComponentActionTypes = {
  ADD_COMPONENT: 'AddComponent',
};

function createAction<T extends ValueOf<typeof PageComponentActionTypes>, P>(
  type: T,
  payload: P,
) {
  return {
    type,
    payload,
  };
}

export const PageComponentActionCreator = {
  ADD_COMPONENT: (componentName: string, component: PageComponent) =>
    createAction(PageComponentActionTypes.ADD_COMPONENT, {
      componentName,
      component,
    }),
};

type PageComponentAction<
  A extends keyof typeof PageComponentActionCreator = keyof typeof PageComponentActionCreator
> = ReturnType<typeof PageComponentActionCreator[A]>;

const pageComponentReducer: Reducer<Readonly<PageComponentsState>> = u(
  (state: PageComponentsState, action: PageComponentAction) => {
    switch (action.type) {
      case PageComponentActionTypes.ADD_COMPONENT: {
        return {
          ...state,
          [action.payload.componentName]: action.payload.component,
        };
      }
    }
    return state;
  },
  {},
);

export const componentsStore = createStore(
  pageComponentReducer,
  composeEnhancers(
    applyMiddleware(
      thunk as ThunkMiddleware<PageComponentsState, PageComponentAction>,
    ),
  ),
);

/**
 * Hook, connect to store. Update if the selectors returns something different, as defined by shouldUpdate.
 * @param selector Select a specific part of the store
 * @param shouldUpdate Will update the component if this function returns true.
 * Default to ref comparing values returned from selector
 */
export const usePageComponentStore = <R>(
  selector: (state: PageComponentsState) => R,
  shouldUpdate?: (oldValue: R, newValue: R) => boolean,
) => useAnyStore(selector, shouldUpdate, componentsStore);

export const pageComponentFactory: <
  P extends { [name: string]: unknown },
  T extends keyof WegasScriptEditorNameAndTypes,
  R extends WegasScriptEditorNameAndTypes[T]
>(
  component: React.FunctionComponent<P>,
  schema: SimpleSchema,
  allowedVariables: T[],
  getComputedPropsFromVariable: (variable: R) => P,
) => PageComponent = (
  component,
  schema,
  allowedVariables,
  getComputedPropsFromVariable,
) => {
  return {
    getComponent: () => component,
    getSchema: () => schema,
    getAllowedVariables: () => allowedVariables,
    getComputedPropsFromVariable,
  };
};

export const registerComponent: (
  componentName: 'SimpleComponent',
  component: PageComponent,
) => void = (componentName, component) => {
  componentsStore.dispatch(
    PageComponentActionCreator.ADD_COMPONENT(componentName, component),
  );
};
