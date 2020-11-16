import * as React from 'react';
import { createStore, Reducer, applyMiddleware } from 'redux';
import u from 'immer';
import { composeEnhancers } from '../../../data/store';
import thunk, { ThunkMiddleware } from 'redux-thunk';
import { useAnyStore } from '../../Hooks/storeHookFactory';
import {
  WegasComponentProps,
  PageComponentProps,
  DropZones,
} from './EditableComponent';
import { Icon } from '../../../Editor/Components/Views/FontAwesome';
import { SchemaPropsSchemas } from './schemaProps';
import {
  IVariableDescriptor,
  WegasClassNameAndScriptableTypes,
} from 'wegas-ts-api';
import { HashListChoices } from '../../../Editor/Components/FormView/HashList';
import { ChildrenDeserializerProps } from './PageDeserializer';
import { classAndStyleShema } from './options';

export const componentTypes = [
  'Other',
  'Layout',
  'Input',
  'Output',
  'Advanced',
  'Programmatic',
] as const;

export type ComponentType = typeof componentTypes[number];

/**
 * ContainerComponent - Defines the type and management of a container component
 */
export interface ContainerComponent<P = {}> {
  isVertical: (props?: P) => boolean | undefined;
  ChildrenDeserializer: React.FunctionComponent<ChildrenDeserializerProps<P>>;
  noContainer?: (props?: P) => boolean | undefined;
  childrenSchema: HashListChoices;
  childrenLayoutKeys?: string[];
  deleteChildren?: (
    page: WegasComponent,
    path: number[],
  ) => WegasComponent | undefined;
}

export interface PageComponent<
  P extends WegasComponentProps = WegasComponentProps,
  T extends IVariableDescriptor['@class'] = IVariableDescriptor['@class']
> {
  WegasComponent: React.FunctionComponent<P>;
  container?: ContainerComponent<P>;
  componentType: ComponentType;
  componentName: string;
  icon: Icon;
  dropzones?: DropZones;
  schema: {
    description: string;
    properties: { [prop: string]: SchemaPropsSchemas };
  };
  /**
   * indicates for which kind of variables this component suits well
   */
  allowedVariables?: T[];
  /**
   * gives a computed list of props from variable, if the variable is undefined, gives default props
   */
  getComputedPropsFromVariable?: (
    variable?: WegasClassNameAndScriptableTypes[T],
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

const pageComponentReducer: Reducer<
  Readonly<PageComponentsState>,
  PageComponentAction
> = u((state: PageComponentsState, action: PageComponentAction) => {
  switch (action.type) {
    case PageComponentActionTypes.ADD_COMPONENT: {
      state[action.payload.componentName] = action.payload.component;
      break;
    }
  }
}, {});

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
  C extends ContainerComponent<P> | undefined,
  P extends WegasComponentProps,
  T extends IVariableDescriptor['@class']
>(
  param: {
    component: React.FunctionComponent<P>;
    componentType: ComponentType;
    container?: C;
    name: string;
    icon: Icon;
    dropzones?: DropZones;
    schema: { [prop: string]: SchemaPropsSchemas };
    allowedVariables?: T[];
  } & (C extends undefined
    ? {
        getComputedPropsFromVariable?: (
          variable?: WegasClassNameAndScriptableTypes[T],
        ) => Omit<P, keyof PageComponentProps>;
      }
    : {
        getComputedPropsFromVariable: (
          variable?: WegasClassNameAndScriptableTypes[T],
        ) => Omit<P, keyof PageComponentProps> & { children: WegasComponent[] };
      }),
): PageComponent<P> {
  return {
    WegasComponent: param.component,
    componentType: param.componentType,
    container: param.container,
    icon: param.icon,
    dropzones: param.dropzones,
    componentName: param.name,
    schema: {
      description: param.name,
      properties: { ...classAndStyleShema, ...param.schema },
    },
    allowedVariables: param.allowedVariables,
    getComputedPropsFromVariable: param.getComputedPropsFromVariable,
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
