import * as React from 'react';
import { createStore, Reducer, applyMiddleware } from 'redux';
import u from 'immer';
import { composeEnhancers } from '../../../data/store';
import thunk, { ThunkMiddleware } from 'redux-thunk';
import { useAnyStore } from '../../Hooks/storeHookFactory';
import {
  EditableComponent,
  PageComponentProps,
  PageComponentMandatoryProps,
  defaultMandatoryKeys,
} from './EditableComponent';
import { Icon } from '../../../Editor/Components/Views/FontAwesome';
import { SchemaPropsSchemas } from './schemaProps';
import { pick, omit } from 'lodash-es';
import { flexItemDefaultKeys } from '../../Layouts/FlexList';

export interface PageComponent<P extends {} = {}> {
  getComponent: (
    uneditable?: boolean,
  ) => React.FunctionComponent<P & PageComponentProps>;
  getName: () => string;
  getIcon: () => Icon;
  getSchema: () => {
    description: string;
    properties: { [prop: string]: SchemaPropsSchemas };
  };
  getAllowedVariables: () => (keyof WegasScriptEditorNameAndTypes)[];
  /**
   * gives a computed list of props from variable, if the variable is undefined, gives default props
   */
  getComputedPropsFromVariable: (
    variable?: WegasScriptEditorReturnType,
  ) => Omit<P, keyof PageComponentMandatoryProps>;
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
  P extends PageComponentMandatoryProps,
  T extends keyof WegasScriptEditorNameAndTypes,
  V extends Readonly<WegasScriptEditorNameAndTypes[T]>,
  R extends Omit<P, keyof PageComponentMandatoryProps>
>(
  component: React.FunctionComponent<P>,
  componentName: string,
  icon: Icon,
  schema: { [prop: string]: SchemaPropsSchemas },
  allowedVariables: T[],
  getComputedPropsFromVariable: (variable?: V) => R,
): PageComponent<P> {
  function generateComponent(
    uneditable?: boolean,
  ): React.FunctionComponent<P & PageComponentProps> {
    const Editable: React.FunctionComponent<P & PageComponentProps> = props => (
      <EditableComponent
        {...props}
        componentName={componentName}
        wegasChildren={props.children}
        uneditable={uneditable}
      >
        {(content, ComponentContainer, showBorders) =>
          component({
            ...props,
            children: content,
            ComponentContainer,
            showBorders,
          })
        }
      </EditableComponent>
    );
    return Editable;
  }
  return {
    getComponent: (uneditable?: boolean) => generateComponent(uneditable),
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

export type PageComponentFactorySchemas = ReturnType<
  typeof pageComponentFactory
>['getSchema'];

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

/**
 * Extracts props from WegasComponent props
 * @param props
 */
export function extractProps<T>(props: PageComponentMandatoryProps & T) {
  return {
    ComponentContainer: props.ComponentContainer,
    showBorders: props.showBorders,
    path: props.path,
    flexProps: pick(props, flexItemDefaultKeys),
    childProps: omit(props, [
      ...defaultMandatoryKeys,
      ...flexItemDefaultKeys,
    ]) as T,
  };
}
