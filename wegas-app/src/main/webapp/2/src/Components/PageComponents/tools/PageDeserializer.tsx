import * as React from 'react';
import { usePageComponentStore } from './componentFactory';
import { ErrorBoundary } from '../../../Editor/Components/ErrorBoundary';
import { ContainerTypes } from './EditableComponent';

interface PageDeserializerProps {
  json: WegasComponent;
  path?: number[];
  uneditable?: boolean;
  childrenType?: ContainerTypes;
}

export function PageDeserializer({
  json,
  path,
  uneditable,
  childrenType,
}: PageDeserializerProps): JSX.Element {
  const realPath = path ? path : [];
  const { children = [], ...restProps } = (json && json.props) || {};
  const component = usePageComponentStore(s => s[(json && json.type) || '']);

  return component ? (
    <ErrorBoundary>
      {component.getComponent(uneditable)({
        childrenType,
        path: realPath,
        ...restProps,
        children: children.map((cjson, i) => (
          <PageDeserializer
            key={i}
            json={cjson}
            path={[...realPath, i]}
            uneditable={uneditable}
            childrenType={component.getContainerType()}
          />
        )),
      })}
    </ErrorBoundary>
  ) : json == null ? (
    <div>Unknown page</div>
  ) : (
    <div>{`Unknown component : ${json.type}`}</div>
  );
}
