import { cloneDeep, pick } from 'lodash-es';
import * as React from 'react';
import { grow } from '../../../css/classes';
import { State } from '../../../data/Reducer/reducers';
import { useStore } from '../../../data/Stores/store';
import { pageCTX } from '../../../Editor/Components/Page/PageEditor';
import { classNameOrEmpty } from '../../../Helper/className';
import { deepDifferent, shallowDifferent } from '../../Hooks/storeHookFactory';
import { useDeepMemo } from '../../Hooks/useDeepMemo';
import { TumbleLoader } from '../../Loader';
import {
  PageComponent,
  PageComponentsState,
  usePageComponentStore,
} from './componentFactory';
import {
  ComponentContainer,
  ItemContainer,
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

export type ChildrenDeserializerProps<P = {}> = P & {
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
  Container,
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

  const { children, ...restProps } =
    (wegasComponent && wegasComponent.props) || emptyObject;

  const componentSeletor = React.useCallback(
    (s: PageComponentsState) =>
      s[(wegasComponent && wegasComponent.type) || ''],
    [wegasComponent],
  );
  const component = usePageComponentStore(
    componentSeletor,
    shallowDifferent,
  ) as PageComponent;

  const optionsState = useOptions(
    pick(restProps, defaultOptionsKeys),
    context || emptyObject,
    inheritedOptionsState,
  );

  const nbRendering = React.useRef(0);
  React.useEffect(() => {
    nbRendering.current += 1;
  }, []);

  const { WegasComponent, container, componentName, obsoleteComponent } =
    component || emptyObject;

  if (!wegasComponent) {
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
    return <div>{`Unknown component : ${wegasComponent.type}`}</div>;
  }

  const Children = container
    ? container.ChildrenDeserializer
    : (DefaultChildren as React.FunctionComponent<ChildrenDeserializerProps>);

  return (
    <>
      {Container == null ||
      (container?.noContainer &&
        container?.noContainer(wegasComponent.props as WegasComponentProps)) ? (
        <Children
          {...wegasComponent?.props}
          wegasChildren={children}
          path={realPath}
          pageId={pageId}
          uneditable={uneditable}
          context={context}
          editMode={editMode}
          containerPropsKeys={containerPropsKeys}
          inheritedOptionsState={pick(optionsState, heritableOptionsStateKeys)}
        />
      ) : (
        <ComponentContainer
          // the key is set in order to force rerendering when page change
          //(if not, if an error occures and the page's strucutre is the same it won't render the new component)
          key={pageId}
          path={realPath}
          pageId={pageId}
          componentType={componentName}
          isContainer={container != null}
          context={context}
          vertical={container?.isVertical(
            wegasComponent.props as WegasComponentProps,
          )}
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
            wegasComponent,
          ) ? (
            <ObsoleteComponentManager
              componentType={componentName}
              pageId={pageId}
              path={realPath}
              sanitizer={obsoleteComponent.sanitizer}
            />
          ) : (
            <WegasComponent
              path={realPath}
              pageId={pageId}
              context={context}
              componentType={componentName}
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
                {...wegasComponent?.props}
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
      )}
    </>
  );
}
