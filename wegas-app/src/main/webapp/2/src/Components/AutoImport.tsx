import * as React from 'react';

function Loader() {
  return <span>...</span>;
}
/**
 * Create a Component from a path relative to ./AutoImport.
 * It loads it's default export as a Component
 * @param type Component type. File path under ./AutoImport
 */
export function importComponent(type: string) {
  class AutoLoadedComponent extends React.Component {
    static displayName = `Loaded(${type})`;
    state: { Comp: React.ComponentType<any> } = { Comp: Loader };
    mounted: boolean = true;
    componentDidMount() {
      import(/* webpackChunkName: "Component/[request]" */ `./AutoImport/${type}`)
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
