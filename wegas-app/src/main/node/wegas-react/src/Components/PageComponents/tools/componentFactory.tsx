import { omit } from 'lodash-es';
import * as React from 'react';
import {
  IVariableDescriptor,
  WegasClassNameAndScriptableTypes,
} from 'wegas-ts-api';
import { dispatch } from '../../../store/store';
import { setInitStatus } from '../../../store/slices/initStatus';
import { AvailableSchemas } from '../../../Editor/Components/FormView';
import { IconComponentType } from '../../../Editor/Components/Page/ComponentIcon';
import { Icon } from '../../../Editor/Components/Views/FontAwesome';
import { shallowEqual } from '../../../store/hooks';
import {
  DropZones,
  PageComponentProps,
  WegasComponentProps,
} from './EditableComponent';
import { classStyleIdSchema } from './options';
import { ChildrenDeserializerProps } from './PageDeserializer';
import { wlog } from '../../../Helper/wegaslog';

export const usableComponentType = [
  'Layout',
  'Input',
  'Output',
  'Advanced',
  'Programmatic',
  'Maps',
  'GameDesign',
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
export interface ContainerComponent<P = UnknownValuesObject> {
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
  componentName: string;
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

/* ------------------------------------------------------------------ *
 * Registry
 *
 * Every page component registers itself once, while its module loads (see
 * importPageComponents), and the registry never changes afterwards. That is
 * all this needs: a snapshot replaced on each registration, plus listeners.
 * Not redux state: entries are React components, and nothing ever dispatches
 * anything else here.
 * ------------------------------------------------------------------ */

let registry: Readonly<PageComponentsState> = {};
const registryListeners = new Set<() => void>();

function subscribeRegistry(listener: () => void) {
  registryListeners.add(listener);
  return () => {
    registryListeners.delete(listener);
  };
}

const getRegistry = () => registry;

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

  const allPromises = componentModules
    .keys()
    .map(k => componentModules<Promise<unknown>>(k));

  Promise.all(allPromises).then(() => {
    wlog('One is glad to be of service 🤖');
    dispatch(setInitStatus({ key: 'components', status: true }));
  });
};

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
 * Hook, subscribe to the page component registry. Re-renders when the selected
 * value changes according to `isEqual` (default shallowEqual).
 *
 * `isEqual` returns true when the values are EQUAL (shallowEqual, deepEqual),
 * like useAppSelector's equality functions.
 */
export function usePageComponentStore<R>(
  selector: (state: PageComponentsState) => R,
  isEqual: (a: R, b: R) => boolean = shallowEqual,
): R {
  // The last selection: returned again while the registry and the selector are
  // unchanged (useSyncExternalStore requires a cached snapshot), and while a
  // new selection is equal to it, so consumers keep a stable reference.
  const last = React.useRef<{
    registry: PageComponentsState;
    selector: typeof selector;
    value: R;
  }>();

  const getSelection = () => {
    const current = getRegistry();
    const previous = last.current;
    if (
      previous &&
      previous.registry === current &&
      previous.selector === selector
    ) {
      return previous.value;
    }
    const next = selector(current);
    const value =
      previous && isEqual(previous.value, next) ? previous.value : next;
    last.current = { registry: current, selector, value };
    return value;
  };

  return React.useSyncExternalStore(subscribeRegistry, getSelection);
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
    componentName: param.name,
    schema: {
      description: param.name,
      properties: { ...classStyleIdSchema, ...param.schema },
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
export const registerComponent: (
  component: PageComponent,
) => void = component => {
  registry = { ...registry, [component.componentId]: component };
  for (const listener of [...registryListeners]) {
    listener();
  }
};
