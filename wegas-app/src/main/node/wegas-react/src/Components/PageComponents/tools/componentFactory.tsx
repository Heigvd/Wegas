import u from 'immer';
import { omit } from 'lodash-es';
import * as React from 'react';
import { applyMiddleware, compose, createStore, Reducer } from 'redux';
import thunk, { ThunkMiddleware } from 'redux-thunk';
import {
  IVariableDescriptor,
  WegasClassNameAndScriptableTypes,
} from 'wegas-ts-api';
import { AvailableSchemas } from '../../../Editor/Components/FormView';
import { IconComponentType } from '../../../Editor/Components/Page/ComponentIcon';
import { Icon } from '../../../Editor/Components/Views/FontAwesome';
import { useAnyStore } from '../../Hooks/storeHookFactory';
import {
  DropZones,
  PageComponentProps,
  WegasComponentProps,
} from './EditableComponent';
import { classStyleIdShema } from './options';
import { ChildrenDeserializerProps } from './PageDeserializer';

export const usableComponentType = [
  'Layout',
  'Input',
  'Output',
  'Advanced',
  'Programmatic',
  'Maps',
] as const;

export const componentTypes = [
  ...usableComponentType,
  'Other',
  'Utility',
] as const;

export type ComponentType = typeof componentTypes[number];

export interface Submenu {
  label: string;
  icon: Icon;
  startIndex: number;
  stopIndex?: number;
}

export interface Submenus {
  [id: string]: Submenu;
}

/**
 * ContainerComponent - Defines the type and management of a container component
 */
export interface ContainerComponent<P = UknownValuesObject> {
  isVertical?: (props?: P) => boolean | undefined;
  ChildrenDeserializer?: React.FunctionComponent<ChildrenDeserializerProps<P>>;
  childrenAdditionalShema?: { [prop: string]: AvailableSchemas };
  childrenLayoutOptionSchema?: HashListChoices;
  childrenLayoutKeys?: string[];
}

interface PageComponentBehaviour {
  /** Can it be deleted */
  allowDelete: (props: WegasComponent) => boolean;
  /** Can it be dragged */
  allowMove: (props: WegasComponent) => boolean;
  /** Can it accept drop */
  allowChildren: (props: WegasComponent) => boolean;
  /** Accept only specific children types */
  filterChildrenType: string[] | undefined;
  /** Accept only specific children names */
  filterChildrenName: string[] | undefined;
  /** Can it be edited */
  allowEdit: (props: WegasComponent) => boolean;
}

export const defaultPageComponentBehaviour: PageComponentBehaviour = {
  allowDelete: function () {
    return true;
  },
  allowMove: function () {
    return true;
  },
  allowChildren: function (component) {
    return component.props?.children != null;
  },
  filterChildrenType: undefined,
  filterChildrenName: undefined,
  allowEdit: function () {
    return true;
  },
};

interface ComponentFactoryBasicParameters<
  P extends WegasComponentProps,
  C extends ContainerComponent<P> | undefined,
  T extends IVariableDescriptor['@class'],
> {
  /**
   * The id of the component
   */
  id: string;
  /**
   * The name of the component
   */
  name: string;
  /**
   * The icon of the component
   */
  icon: Icon;
  /**
   * The illustration of the component for the palette
   */
  illustration?: IconComponentType;
  /**
   * Component to display
   */
  component: React.FunctionComponent<P>;
  /**
   * The category in wich the component is registered
   */
  componentType: ComponentType;
  /**
   * Indicates if the component contains children and how to manage them
   */
  container?: C;
  /**
   * Indicates if the component manages onClick by itself (i.e. a button like component)
   */
  manageOnClick?: boolean;
  /**
   * Indicates where to display dropzones when other compoments are dragged over
   */
  dropzones?: DropZones;
  /**
   * Indicates who to manage the component properties
   */
  schema: { [prop: string]: AvailableSchemas };
  /**
   * Indicates for which kind of variables this component suits well
   */
  allowedVariables?: T[];
  /**
   * Allows to modify a component or its props when obsolete
   */
  obsoleteComponent?: {
    /**
     * Indicates if the obsolete component should still be displayed to the player.
     */
    keepDisplayingToPlayer: boolean;
    /**
     * Returns if the component is obsolete or not
     */
    isObsolete: (oldComponent: WegasComponent) => boolean;
    /**
     * Returns a new component that is not obsolete
     */
    sanitizer: (oldComponent: WegasComponent) => WegasComponent;
  };
  /** Allow to control the behaviour of a component */
  behaviour?: Partial<PageComponentBehaviour>;
}

const pageComponentOmitProps = [
  'schema',
  'component',
  'name',
  'getComputedPropsFromVariable',
] as const;

type PageComponentOmitProps = ValueOf<typeof pageComponentOmitProps>;
export interface PageComponent<
  P extends WegasComponentProps = WegasComponentProps,
  C extends ContainerComponent<P> | undefined = ContainerComponent<P>,
  T extends IVariableDescriptor['@class'] = IVariableDescriptor['@class'],
> extends Omit<
    ComponentFactoryBasicParameters<P, C, T>,
    PageComponentOmitProps
  > {
  WegasComponent: React.FunctionComponent<P>;
  componentId: string;
  schema: {
    description: string;
    properties: { [prop: string]: AvailableSchemas };
  };
  getComputedPropsFromVariable?: (
    variable?: WegasClassNameAndScriptableTypes[T],
  ) => Omit<P, keyof PageComponentProps> & { children?: WegasComponent[] };
}

export interface PageComponentsState {
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
  A extends keyof typeof PageComponentActionCreator = keyof typeof PageComponentActionCreator,
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

const composeEnhancers: typeof compose =
  (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export const componentsStore = createStore(
  pageComponentReducer,
  composeEnhancers(
    applyMiddleware(
      thunk as ThunkMiddleware<PageComponentsState, PageComponentAction>,
    ),
  ),
);

type ComponentFactoryParameters<
  P extends WegasComponentProps,
  C extends ContainerComponent<P> | undefined,
  T extends IVariableDescriptor['@class'],
> = ComponentFactoryBasicParameters<P, C, T> &
  (C extends undefined
    ? {
        getComputedPropsFromVariable: (
          /**
           * gives a computed list of props from variable, if the variable is undefined, gives default props
           */
          variable?: WegasClassNameAndScriptableTypes[T],
        ) => Omit<P, keyof PageComponentProps> & { children: WegasComponent[] };
      }
    : {
        /**
         * gives a computed list of props from variable, if the variable is undefined, gives default props
         */
        getComputedPropsFromVariable?: (
          variable?: WegasClassNameAndScriptableTypes[T],
        ) => Omit<P, keyof PageComponentProps>;
      });

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
  C extends ContainerComponent<P> | undefined,
  T extends IVariableDescriptor['@class'],
>(param: ComponentFactoryParameters<P, C, T>): PageComponent<P, C, T> {
  return {
    ...omit(param, pageComponentOmitProps),
    WegasComponent: param.component,
    componentId: param.id,
    schema: {
      description: param.name,
      properties: { ...classStyleIdShema, ...param.schema },
    },
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
export const registerComponent: (component: PageComponent) => void =
  component => {
    componentsStore.dispatch(
      PageComponentActionCreator.ADD_COMPONENT(
        component.componentId,
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
