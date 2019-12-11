import * as React from 'react';
import { createStore, Reducer, applyMiddleware } from 'redux';
import u from 'immer';
import { composeEnhancers } from '../../data/store';
import thunk, { ThunkMiddleware } from 'redux-thunk';
import { useAnyStore } from '../Hooks/storeHookFactory';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { EditableComponent, PageComponentProps } from './EditableComponent';

export interface PageComponent<P = {}> {
  getComponent: () => React.FunctionComponent<P>;
  getName: () => string;
  getIcon: () => IconProp;
  getSchema: () => SimpleSchema;
  getAllowedVariables: () => (keyof WegasScriptEditorNameAndTypes)[];
  /**
   * gives a computed list of props from variable, if the variable is undefined, gives default props
   */
  getComputedPropsFromVariable: (variable?: WegasScriptEditorReturnType) => P;
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
export function usePageComponentStore<R>(
  selector: (state: PageComponentsState) => R,
  shouldUpdate?: (oldValue: R, newValue: R) => boolean,
) {
  return useAnyStore(selector, shouldUpdate, componentsStore);
}

export function pageComponentFactory<
  P extends { [name: string]: unknown } & { children?: WegasComponent[] },
  T extends keyof WegasScriptEditorNameAndTypes,
  V extends Readonly<WegasScriptEditorNameAndTypes[T]>
>(
  component: React.FunctionComponent<P>,
  componentName: string,
  icon: IconProp,
  schema: SimpleSchema,
  allowedVariables: T[],
  getComputedPropsFromVariable: (variable?: V) => P,
) {
  const Editable = (props: P & PageComponentProps) => (
    <EditableComponent
      {...props}
      componentName={componentName}
      wegasChildren={props.children}
    >
      {content => component({ ...props, children: content })}
    </EditableComponent>
  );
  return {
    getComponent: () => Editable,
    getIcon: () => icon,
    getName: () => componentName,
    getSchema: () => ({
      description: componentName,
      properties: schema,
    }),
    getAllowedVariables: () => allowedVariables,
    getComputedPropsFromVariable,
  };
}

/**
 * Function that registers a component dynamically.
 * @implNote This function must be placed on a file that contains ".component." in its name
 * @param componentName
 * @param component
 */
export const registerComponent: (
  component: PageComponent,
) => void = component => {
  componentsStore.dispatch(
    PageComponentActionCreator.ADD_COMPONENT(component.getName(), component),
  );
};
