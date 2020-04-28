import * as React from 'react';
import { usePageComponentStore } from './componentFactory';
import { ErrorBoundary } from '../../../Editor/Components/ErrorBoundary';
import { ContainerTypes } from './EditableComponent';

interface PageDeserializerProps {
  json: WegasComponent;
  path?: number[];
  uneditable?: boolean;
  childrenType?: ContainerTypes;
  last?: boolean;
}

export function PageDeserializer({
  json,
  path,
  uneditable,
  childrenType,
  last,
}: PageDeserializerProps): JSX.Element {
  const realPath = path ? path : [];
  const { children = [], ...restProps } = (json && json.props) || {};
  const component = usePageComponentStore(s => s[(json && json.type) || '']);

  if (json == null) {
    return <pre>Unknown page</pre>;
  }
  if (!component) {
    return <div>{`Unknown component : ${json.type}`}</div>;
  }

  const Component = component.getComponent(uneditable);

  return (
    <ErrorBoundary>
      <Component
        path={realPath}
        last={last}
        containerType={component.getContainerType()}
        childrenType={childrenType}
        {...restProps}
      >
        {children.map((cjson, i) => (
          <PageDeserializer
            key={i}
            json={cjson}
            path={[...realPath, i]}
            uneditable={uneditable}
            childrenType={component.getContainerType()}
            last={i === children.length - 1}
          />
        ))}
      </Component>
    </ErrorBoundary>
  );
}
