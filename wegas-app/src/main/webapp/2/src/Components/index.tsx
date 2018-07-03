import * as React from 'react';

function Loader() {
  return <span>...</span>;
}
export function importComponent(type: string) {
  class AutoLoadedComponent extends React.Component {
    static displayName = `Loaded(${type})`;
    state: { Comp: React.ComponentType<any> } = { Comp: Loader };
    componentDidMount() {
      import(`./AutoImport/${type}`)
        .then(exp => {
          this.setState({ Comp: exp.default });
        })
        .catch(() => {
          this.setState({ Comp: () => <span>Error loading "{type}"</span> });
        });
    }
    render() {
      return <this.state.Comp {...this.props} />;
    }
  }
  return AutoLoadedComponent;
}
