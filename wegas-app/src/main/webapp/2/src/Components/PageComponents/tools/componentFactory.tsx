import * as React from 'react';
import { createStore, Reducer, applyMiddleware } from 'redux';
import u from 'immer';
import { composeEnhancers } from '../../../data/store';
import thunk, { ThunkMiddleware } from 'redux-thunk';
import { useAnyStore } from '../../Hooks/storeHookFactory';
import {
  ContainerTypes,
  WegasComponentProps,
  PageComponentProps,
} from './EditableComponent';
import { Icon } from '../../../Editor/Components/Views/FontAwesome';
import { SchemaPropsSchemas } from './schemaProps';

export interface PageComponent<P extends {} = {}> {
  Component: React.FunctionComponent<P>;
  containerType: ContainerTypes;
  componentName: string;
  icon: Icon;
  schema: {
    description: string;
    properties: { [prop: string]: SchemaPropsSchemas };
  };
  allowedVariables: (keyof WegasScriptEditorNameAndTypes)[];
  /**
   * gives a computed list of props from variable, if the variable is undefined, gives default props
   */
  getComputedPropsFromVariable: (
    variable?: WegasScriptEditorReturnType,
  ) => Omit<P, keyof PageComponentProps>;
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

/**
 * importPageComponents will import all pages component in the project. This function must be called in the entry file.
 */
export const importPageComponents = () => {
  // Importing all the files containing ".component." to allow component registration without explicit import
  const componentModules = require.context(
    '../../../',
    true,
    /\.component\./,
    'lazy-once',
  );
  componentModules.keys().map(k => componentModules(k));
};

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
  P extends WegasComponentProps,
  T extends keyof WegasScriptEditorNameAndTypes,
  V extends Readonly<WegasScriptEditorNameAndTypes[T]>,
  R extends Omit<P, keyof PageComponentProps>
>(
  WegasComponent: React.FunctionComponent<P>,
  componentName: string,
  icon: Icon,
  schema: { [prop: string]: SchemaPropsSchemas },
  allowedVariables: T[],
  getComputedPropsFromVariable: (variable?: V) => R,
  containerType?: ContainerTypes,
): PageComponent<P> {
  return {
    Component: WegasComponent,
    containerType,
    icon,
    componentName,
    schema: {
      description: componentName,
      properties: schema,
    },
    allowedVariables,
    getComputedPropsFromVariable,
  };
}

export type PageComponentFactorySchemas = ReturnType<
  typeof pageComponentFactory
>['schema'];

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
    PageComponentActionCreator.ADD_COMPONENT(
      component.componentName,
      component,
    ),
  );
};

/**
 * Importing all the files containing ".component.".
 * Allows component registration without explicit import within the hole project path
 */
export const importComponents = () => {
  const componentModules = require.context(
    '../../../',
    true,
    /\.component\./,
    'lazy-once',
  );
  componentModules.keys().map(k => componentModules(k));
};
