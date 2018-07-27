import * as React from 'react';

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
function Loader() {
  return <span>...</span>;
}
/**
 * Create a Component from a path relative to ./AutoImport.
 * It loads it's default export as a Component
 * @param type Component type. File path under ./AutoImport
 */
function importComponent(type: string) {
  const load = import(/* webpackChunkName: "Component/[request]" */ `./AutoImport/${type}`);
  class AutoLoadedComponent extends React.Component {
    static displayName = `Loaded(${type})`;
    state: { Comp: React.ComponentType<any> } = { Comp: Loader };
    mounted: boolean = true;
    componentDidMount() {
      load
        .then(exp => {
          this.mounted && this.setState({ Comp: exp.default });
        })
        .catch(() => {
          this.mounted &&
            this.setState({ Comp: () => <span>Error loading "{type}"</span> });
        });
    }
    componentWillUnmount() {
      this.mounted = false;
    }
    render() {
      return <this.state.Comp {...this.props} />;
    }
  }
  return AutoLoadedComponent;
}
