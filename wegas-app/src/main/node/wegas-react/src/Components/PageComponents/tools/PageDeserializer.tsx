import { cloneDeep, pick } from 'lodash-es';
import * as React from 'react';
import { grow } from '../../../css/classes';
import { State } from '../../../data/Reducer/reducers';
import { useStore } from '../../../data/Stores/store';
import { classNameOrEmpty } from '../../../Helper/className';
import { deepDifferent, shallowDifferent } from '../../Hooks/storeHookFactory';
import { useDeepMemo } from '../../Hooks/useDeepMemo';
import { TumbleLoader } from '../../Loader';
import { pageCTX } from '../../Page/PageEditor';
import {
  PageComponent,
  PageComponentsState,
  usePageComponentStore,
} from './componentFactory';
import {
  ComponentContainer,
  ItemContainer,
  sanitizeExtraAttributes,
  WegasComponentItemProps,
  WegasComponentProps,
} from './EditableComponent';
import {
  displayObsoleteComponentManager,
  ObsoleteComponentManager,
} from './ObsoleteComponentManager';
import {
  defaultOptionsKeys,
  HeritableOptionsState,
  heritableOptionsStateKeys,
  useOptions,
} from './OptionsComponent';

const emptyPath: number[] = [];
const emptyObject: any = {};

export function getComponentFromPath(page: WegasComponent, path: number[]) {
  const newPath = [...path];
  let component = page;
  while (newPath.length > 0) {
    const index = newPath.shift();
    if (
      index == null ||
      component == null ||
      component.props == null ||
      component.props.children == null
    ) {
      return undefined;
    } else {
      component = component.props.children[index];
    }
  }
  return cloneDeep(component);
}

export type ChildrenDeserializerProps<P = UknownValuesObject> = P & {
  editMode: boolean;
  wegasChildren?: WegasComponent[];
  path: number[];
  pageId?: string;
  uneditable?: boolean;
  containerPropsKeys?: string[];
  // the content of context can be any because it's set at runtime by the user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context?: { [exposeAs: string]: any };
  /**  Options' state inherited from the parent */
  inheritedOptionsState: HeritableOptionsState;
};

function DefaultChildren(_: ChildrenDeserializerProps) {
  return null;
}

export const DummyContainer: ItemContainer = React.forwardRef<
  HTMLDivElement,
  WegasComponentItemProps
>(
  (
    {
      onClick,
      onMouseOver,
      onMouseLeave,
      onDragOver,
      onDragEnter,
      onDragLeave,
      onDragEnd,
      className,
      style = {},
      tooltip,
      children,
      id,
      extraAttributes,
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        id={id}
        onClick={onClick}
        onMouseOver={onMouseOver}
        onMouseLeave={onMouseLeave}
        onDragOver={onDragOver}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragEnd={onDragEnd}
        className={className}
        style={style}
        title={tooltip}
        {...sanitizeExtraAttributes(extraAttributes)}
      >
        {children}
      </div>
    );
  },
);
DummyContainer.displayName = 'DummyContainer';

interface PageDeserializerProps {
  pageId?: string;
  path?: number[];
  uneditable?: boolean;
  context?: {
    [name: string]: unknown;
  };
  Container?: ItemContainer;
  containerPropsKeys?: string[];
  dropzones: {
    side?: boolean;
    center?: boolean;
    empty?: boolean;
  };
  /**  Options' state inherited from the parent */
  inheritedOptionsState: HeritableOptionsState;
}

export function PageDeserializer({
  pageId,
  path,
  uneditable,
  context: oldContext,
  Container = DummyContainer,
  containerPropsKeys,
  dropzones,
  inheritedOptionsState: newInheritedOptionsState,
}: PageDeserializerProps): JSX.Element {
  const newPath = path ? path : emptyPath;
  const realPath = useDeepMemo(newPath);

  const inheritedOptionsState = useDeepMemo(newInheritedOptionsState);

  const context = useDeepMemo(oldContext);

  const { editMode } = React.useContext(pageCTX);

  const wegasComponentSelector = React.useCallback(
    (s: State) => {
      if (!pageId) {
        return undefined;
      }

      const page = s.pages[pageId];
      if (!page) {
        return undefined;
      }

      return getComponentFromPath(page, realPath);
    },
    [pageId, realPath],
  );

  const wegasComponent = useStore(wegasComponentSelector, deepDifferent);

  const componentSeletor = React.useCallback(
    (s: PageComponentsState) => ({
      ...s[(wegasComponent && wegasComponent.type) || ''],
      // As we use 2 hooks with use effect here, the return off the second one will be done after a first render.
      // We must store and use the wegasComponent given here in order to avoid giving old props to a new component.
      currentWegasComponent: wegasComponent,
    }),
    [wegasComponent],
  );
  const component = usePageComponentStore(
    componentSeletor,
    shallowDifferent,
  ) as PageComponent & { currentWegasComponent: WegasComponent | undefined };

  const {
    WegasComponent,
    container,
    componentId,
    obsoleteComponent,
    currentWegasComponent,
  } = component || emptyObject;

  const { children, ...restProps } =
    (currentWegasComponent && currentWegasComponent.props) || emptyObject;

  const optionsState = useOptions(
    pick(restProps, defaultOptionsKeys),
    context || emptyObject,
    inheritedOptionsState,
  );

  const nbRendering = React.useRef(0);
  React.useEffect(() => {
    nbRendering.current += 1;
  }, []);

  if (!currentWegasComponent) {
    return <pre>JSON error in page</pre>;
  }
  if (!component) {
    if (nbRendering.current === 1) {
      return (
        <div className={grow}>
          <TumbleLoader />
        </div>
      );
    }
    return <div>{`Unknown component : ${currentWegasComponent.type}`}</div>;
  }

  const Children =
    container && container.ChildrenDeserializer
      ? container.ChildrenDeserializer
      : (DefaultChildren as React.FunctionComponent<ChildrenDeserializerProps>);

  return (
    <ComponentContainer
      // the key is set in order to force rerendering when page change
      //(if not, if an error occures and the page's strucutre is the same it won't render the new component)
      key={pageId}
      path={realPath}
      pageId={pageId}
      componentType={componentId}
      isContainer={container != null}
      context={context}
      vertical={
        container?.isVertical &&
        container?.isVertical(
          currentWegasComponent.props as WegasComponentProps,
        )
      }
      Container={Container}
      containerPropsKeys={containerPropsKeys}
      {...restProps}
      dropzones={{ ...component.dropzones, ...dropzones }}
      options={optionsState}
      editMode={editMode}
      onClickManaged={component.manageOnClick === true}
      className={optionsState.outerClassName}
    >
      {displayObsoleteComponentManager(
        obsoleteComponent,
        currentWegasComponent,
      ) ? (
        <ObsoleteComponentManager
          componentType={componentId}
          pageId={pageId}
          path={realPath}
          sanitizer={obsoleteComponent.sanitizer}
        />
      ) : (
        <WegasComponent
          path={realPath}
          pageId={pageId}
          context={context}
          componentType={componentId}
          Container={Container}
          containerPropsKeys={containerPropsKeys}
          {...restProps}
          className={
            classNameOrEmpty(restProps.className) +
            classNameOrEmpty(optionsState.innerClassName)
          }
          dropzones={{ ...component.dropzones, ...dropzones }}
          options={optionsState}
          editMode={editMode}
        >
          <Children
            {...currentWegasComponent?.props}
            wegasChildren={children}
            path={realPath}
            pageId={pageId}
            uneditable={uneditable}
            context={context}
            editMode={editMode}
            containerPropsKeys={container?.childrenLayoutKeys}
            inheritedOptionsState={pick(
              optionsState,
              heritableOptionsStateKeys,
            )}
          />
        </WegasComponent>
      )}
    </ComponentContainer>
  );
}
