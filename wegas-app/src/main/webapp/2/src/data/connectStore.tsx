import * as React from 'react';
import { Store } from 'redux';

/**
 * Shallow compare 2 values with Object.is
 * @param a first value to compare
 * @param b second value to compare
 */
export function shallowIs(a: any, b: any) {
  if (Object.is(a, b)) return true;
  if ('object' === typeof a && 'object' === typeof b) {
    const isArrayA = Array.isArray(a);
    const isArrayB = Array.isArray(b);
    if (isArrayA !== isArrayB) return false;
    if (isArrayA) {
      if ((a as any[]).length !== (b as any[]).length) return false;
      if ((a as any[]).some((v, i) => !Object.is((b as any[])[i], v)))
        return false;
      return true;
    }
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const k of keysA) {
      if (!Object.is(a[k], b[k])) return false;
      if (!keysB.includes(k)) return false;
    }
    return true;
  }
  return false;
}
export function createReduxContext<S extends Store>(store: S) {
  type State = ReturnType<S['getState']>;
  type Dispatch = S['dispatch'];
  const { Consumer, Provider } = React.createContext<{
    state: State;
  }>({
    state: store.getState(),
  });
  interface StoreProps {}

  class ReduxStore extends React.Component<
    StoreProps,
    { state: S; unsub: () => void }
  > {
    state = {
      state: store.getState(),
      unsub: () => undefined,
    };
    componentDidMount() {
      const unsub = store.subscribe(this.onChange);
      this.setState({
        unsub,
      });
    }
    componentWillUnmount() {
      this.state.unsub();
    }
    onChange = () => {
      this.setState({ state: store.getState() });
    };
    render() {
      return (
        <Provider
          value={{
            state: this.state.state
          }}
        >
          {this.props.children}
        </Provider>
      );
    }
  }

  class Indirection<R> extends React.Component<{
    state: R;
    children: (
      store: {
        state: R;
        dispatch: Dispatch;
      },
    ) => React.ReactNode;
  }> {
    shouldComponentUpdate(prevProps: {
      state: R;
      dispatch: Dispatch;
      children: (
        store: {
          state: R;
          dispatch: Dispatch;
        },
      ) => React.ReactNode;
    }) {
      return !shallowIs(this.props.state, prevProps.state);
    }
    render() {
      return this.props.children({
        dispatch: store.dispatch,
        state: this.props.state,
      });
    }
  }

  class ReduxConsumer<R = State> extends React.Component<{
    selector?: ((state: State) => R);
    children: (
      store: {
        state: R;
        dispatch: Dispatch;
      },
    ) => React.ReactNode;
  }> {
    static defaultProps = {
      selector: (state: State) => state,
    };
    render() {
      const { selector, children } = this.props;
      return (
        <Consumer>
          {({ state }) => {
            return (
              <Indirection
                state={selector!(state)}
                children={children}
              />
            );
          }}
        </Consumer>
      );
    }
  }
  return { StoreProvider: ReduxStore, StoreConsumer: ReduxConsumer };
}
