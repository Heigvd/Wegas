import * as React from 'react';
import { usePageComponentStore } from './componentFactory';
import { ErrorBoundary } from '../../../Editor/Components/ErrorBoundary';

interface PageDeserializerProps {
  json: WegasComponent;
  path?: number[];
  uneditable?: boolean;
}

export function PageDeserializer({
  json,
  path,
  uneditable,
}: PageDeserializerProps): JSX.Element {
  const realPath = path ? path : [];
  const { children = [], ...restProps } = (json && json.props) || {};
  const component = usePageComponentStore(s => s[(json && json.type) || '']);

  return component ? (
    <ErrorBoundary>
      {
        component.getComponent(uneditable)({
          path: realPath,
          ...restProps,
          children: children.map((cjson, i) => (
            <PageDeserializer
              key={i}
              json={cjson}
              path={realPath.concat([i])}
              uneditable={uneditable}
            />
          )),
        }) as JSX.Element
      }
    </ErrorBoundary>
  ) : json == null ? (
    <div>Unknown page</div>
  ) : (
    <div>{`Unknown component : ${json.type}`}</div>
  );
}
