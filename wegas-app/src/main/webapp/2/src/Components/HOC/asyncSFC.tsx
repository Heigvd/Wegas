import * as React from 'react';

/**
 * async SFC
 * @param PComp
 * @param Loader
 * @param Err
 */
export function asyncSFC<T>(
  PComp: (props: T) => Promise<React.ReactNode>,
  Loader: React.SFC<{}> = () => <span />,
  Err: React.SFC<{ err: Error }> = () => <span />,
): React.ComponentClass<T> {
  class AsyncDeps extends React.PureComponent<
    T,
    { el: React.ReactNode | null; loaded: boolean }
  > {
    static getDerivedStateFromProps() {
      return { loaded: false };
    }
    mount: boolean = true;
    constructor(props: T) {
      super(props);
      this.state = {
        loaded: false,
        el: Loader({}),
      };
    }
    loadComp() {
      PComp(this.props)
        .then(el => {
          if (this.mount) {
            this.setState({ loaded: true, el });
          }
        })
        .catch(err => {
          if (this.mount) {
            this.setState({ loaded: true, el: Err({ err }) });
          }
        });
    }
    componentDidMount() {
      this.loadComp();
    }
    componentDidUpdate() {
      if (!this.state.loaded) {
        this.loadComp();
      }
    }
    componentWillUnmount() {
      this.mount = false;
    }
    render() {
      return this.state.el;
    }
  }
  return AsyncDeps;
}
