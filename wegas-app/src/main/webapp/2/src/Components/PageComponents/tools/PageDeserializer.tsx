import * as React from 'react';
import { usePageComponentStore } from './componentFactory';
import { ErrorBoundary } from '../../../Editor/Components/ErrorBoundary';
// import { css } from 'emotion';

// const pageStyle = css({
//   width: 'max-content',
//   height: 'max-content',
// });

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
      {
        component.getComponent()({
          path: realPath,
          ...restProps,
          children: children.map((cjson, i) => (
            <PageDeserializer
              key={i}
              json={cjson}
              path={realPath.concat([String(i)])}
            />
          )),
        }) as JSX.Element
      }
    </ErrorBoundary>
  ) : (
    <div>{`Unknown component : ${json.type}`}</div>
  );
}
