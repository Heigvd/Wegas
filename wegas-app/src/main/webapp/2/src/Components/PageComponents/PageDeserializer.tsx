import * as React from 'react';
import { usePageComponentStore } from './componentFactory';
import { ErrorBoundary } from '../../Editor/Components/ErrorBoundary';

interface PageDeserializerProps {
  json: WegasComponent;
  path?: string[];
}

export function PageDeserializer({
  json,
  path,
}: PageDeserializerProps): JSX.Element {
  const realPath = path ? path : [];
  const { children = [], ...restProps } = json.props || {};
  const component = usePageComponentStore(s => s[json.type]);
  return component ? (
    <ErrorBoundary>
      {React.createElement(
        component.getComponent(),
        {
          path: realPath,
          ...restProps,
        },
        children.map((cjson, i) => (
          <PageDeserializer
            key={i}
            json={cjson}
            path={realPath.concat([String(i)])}
          />
        )),
      )}
    </ErrorBoundary>
  ) : (
    <div>{`Unknown component : ${json.type}`}</div>
  );
}
