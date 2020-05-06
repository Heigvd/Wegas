import * as React from 'react';
import { usePageComponentStore } from './componentFactory';
import { ErrorBoundary } from '../../../Editor/Components/ErrorBoundary';
import { ContainerTypes, ComponentContainer } from './EditableComponent';
import { deepDifferent } from '../../Hooks/storeHookFactory';
import { useStore } from '../../../data/store';
import { cloneDeep } from 'lodash-es';

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
}

export function PageDeserializer({
  pageId,
  path,
  uneditable,
  childrenType,
  last,
}: PageDeserializerProps): JSX.Element {
  const realPath = path ? path : [];

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
  const component = usePageComponentStore(
    s => s[(wegasComponent && wegasComponent.type) || ''],
    deepDifferent,
  );

  if (!wegasComponent) {
    return <pre>JSON error in page</pre>;
  }
  if (!component) {
    return <div>{`Unknown component : ${wegasComponent.type}`}</div>;
  }

  const { WegasComponent, containerType, componentName } = component;

  return (
    <ErrorBoundary>
      <ComponentContainer
        path={realPath}
        last={last}
        componentType={componentName}
        containerType={containerType}
        childrenType={childrenType}
        {...restProps}
      >
        <WegasComponent {...restProps}>
          {children.map((_, i) => {
            return (
              <PageDeserializer
                key={JSON.stringify([...realPath, i])}
                pageId={pageId}
                path={[...realPath, i]}
                uneditable={uneditable}
                childrenType={component.containerType}
                last={i === children.length - 1}
              />
            );
          })}
        </WegasComponent>
      </ComponentContainer>
    </ErrorBoundary>
  );
}
