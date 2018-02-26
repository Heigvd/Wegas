import * as React from 'react';

/**
 * async SFC
 * @param Comp
 * @param Loader
 * @param Err
 */
export function asyncSFC<T>(
  Comp: (props: T) => Promise<JSX.Element>,
  Loader: React.SFC<{}> = () => <span />,
  Err: React.SFC<{ err: Error }> = () => <span />,
): React.ComponentClass<T> {
  class AsyncDeps extends React.PureComponent<T, { el: JSX.Element | null }> {
    constructor(props: T) {
      super(props);
      this.state = {
        el: Loader({}),
      };
      Comp(props)
        .then(el => this.setState({ el }))
        .catch(err => this.setState({ el: Err({ err }) }));
    }
    componentWillReceiveProps(nextProps: T) {
      Comp(nextProps)
        .then(el => this.setState({ el }))
        .catch(err => this.setState({ el: Err({ err }) }));
    }
    render() {
      return this.state.el;
    }
  }
  return AsyncDeps;
}
