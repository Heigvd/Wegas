import * as React from 'react';
import { usePageComponentStore } from './componentFactory';
import {
  ContainerTypes,
  ComponentContainer,
  EmptyComponentContainer,
  WegasComponentProps,
  ExtractedLayoutProps,
} from './EditableComponent';
import { deepDifferent } from '../../Hooks/storeHookFactory';
import { useStore } from '../../../data/store';
import { cloneDeep } from 'lodash-es';
import { pageCTX } from '../../../Editor/Components/Page/PageEditor';
import { PlayerLinearLayoutChildrenProps } from '../Layouts/LinearLayout.component';
import { useScript } from '../../Hooks/useScript';

function getComponentFromPath(page: WegasComponent, path: number[]) {
  const newPath = [...path];
  let component: WegasComponent = cloneDeep(page);
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
  return component;
}

interface PageDeserializerProps {
  pageId?: string;
  path?: number[];
  uneditable?: boolean;
  childrenType?: ContainerTypes;
  last?: boolean;
  linearChildrenProps?: ExtractedLayoutProps['linearChildrenProps'];
  context?: {
    [name: string]: unknown;
  };
}

export function PageDeserializer({
  pageId,
  path,
  uneditable,
  childrenType,
  last,
  linearChildrenProps,
  context,
}: PageDeserializerProps): JSX.Element {
  const realPath = path ? path : [];

  const { editMode } = React.useContext(pageCTX);
  const wegasComponent = useStore(s => {
    if (!pageId) {
      return undefined;
    }

    const page = s.pages[pageId];
    if (!page) {
      return undefined;
    }

    return getComponentFromPath(page, realPath);
  }, deepDifferent);

  const { children = [], ...restProps } =
    (wegasComponent && wegasComponent.props) || {};
  const nbChildren = children.length;
  const component = usePageComponentStore(
    s => s[(wegasComponent && wegasComponent.type) || ''],
    deepDifferent,
  ) as {
    WegasComponent: React.FunctionComponent<WegasComponentProps>;
    containerType: ContainerTypes;
    componentName: string;
  };

  const { WegasComponent, containerType, componentName } = component || {};
  const linearProps: PlayerLinearLayoutChildrenProps =
    containerType === 'LINEAR'
      ? { noSplitter: restProps.noSplitter, noResize: restProps.noResize }
      : {};

  const oldRef = React.useRef({
    containerType,
    pageId,
    uneditable,
    path,
  });

  const exposed = restProps.exposeAs;
  const items = useScript<object[]>(restProps.getItemsFn);

  const childrenPack = React.useMemo(() => {
    oldRef.current = { containerType, pageId, uneditable, path };
    let newChildren: JSX.Element[] = [];
    for (let i = 0; i < nbChildren; ++i) {
      if (items) {
        newChildren = items.map((item, id) => {
          const newContext = { ...context, [exposed]: item }
          return <PageDeserializer
            key={JSON.stringify([...(path ? path : []), id])}
            pageId={pageId}
            path={[...(path ? path : []), i]}
            uneditable={uneditable}
            childrenType={containerType}
            linearChildrenProps={linearProps}
            last={i === nbChildren - 1}
            context={newContext}
          />
        });
      }
      else {
        newChildren.push(
          <PageDeserializer
            key={JSON.stringify([...(path ? path : []), i])}
            pageId={pageId}
            path={[...(path ? path : []), i]}
            uneditable={uneditable}
            childrenType={containerType}
            linearChildrenProps={linearProps}
            last={i === nbChildren - 1}
            context={context}
          />,
        );
      }
    }
    return newChildren;
  }, [nbChildren, containerType, pageId, uneditable, path, linearProps, context, exposed, items]);

  if (!wegasComponent) {
    return <pre>JSON error in page</pre>;
  }
  if (!component) {
    return <div>{`Unknown component : ${wegasComponent.type}`}</div>;
  }

  return (
    <ComponentContainer
      // the key is set in order to force rerendering when page change
      //(if not, if an error occures and the page's strucutre is the same it won't render the new component)
      key={pageId}
      path={realPath}
      last={last}
      componentType={componentName}
      containerType={containerType}
      childrenType={childrenType}
      linearChildrenProps={linearChildrenProps}
      context={context}
      {...restProps}
    >
      <WegasComponent
        path={realPath}
        last={last}
        componentType={componentName}
        containerType={containerType}
        childrenType={childrenType}
        context={context}
        {...restProps}
      >
        {editMode && children.length === 0 ? (
          <EmptyComponentContainer
            childrenType={containerType}
            path={realPath}
          />
        ) : editMode && containerType === "FOREACH" ?
            childrenPack.slice(0, 1)
            : childrenPack
        }
      </WegasComponent>
    </ComponentContainer>
  );
}
