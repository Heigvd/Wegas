import * as React from 'react';
import { usePageComponentStore } from './PageComponents/componentFactory';
import { DnDComponent } from '../Editor/Components/Page/ComponentPalette';

export function deserialize(
  json: WegasComponent,
  key?: string | number,
  path: string[] = [],
): JSX.Element {
  const { children = [], ...restProps } = json.props || {};
  // Should await all children as well.
  const type = importComponent(json.type);
  return React.createElement(
    type,
    { key, __path: path, ...restProps } as any,
    children.map((c, i) => deserialize(c, i, path.concat([String(i)]))),
  );
}
/**
 * Create a Component from a path relative to ./AutoImport.
 * It loads it's default export as a Component
 * @param type Component type. File path under ./AutoImport
 */
function importComponent(type: string) {
  return React.lazy(() =>
    import(
      /* webpackChunkName: "Component/[request]" */ `./AutoImport/${type}`
    ),
  );
}

interface PageDeserializerProps {
  json: WegasComponent;
  key?: number;
  path?: string[];
  onDrop?: (dndComponent: DnDComponent, path: string[], index?: number) => void;
}

export function PageDeserializer({
  json,
  key,
  path,
  onDrop,
}: PageDeserializerProps): JSX.Element {
  const realPath = path ? path : [];
  const { children = [], ...restProps } = json.props || {};
  const component = usePageComponentStore(s => s[json.type]);
  return component ? (
    React.createElement(
      component.getComponent(),
      {
        key,
        __path: realPath,
        ...restProps,
        onDrop: (dndComponent: DnDComponent, index?: number) =>
          onDrop && onDrop(dndComponent, realPath, index),
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
