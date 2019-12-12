import * as React from 'react';
import { usePageComponentStore } from './componentFactory';

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
    React.createElement(
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
    )
  ) : (
    <div>{`Unknown component : ${json.type}`}</div>
  );
}
