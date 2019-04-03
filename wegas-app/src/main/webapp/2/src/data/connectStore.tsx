import * as React from 'react';
import { Store } from 'redux';
import { shallowIs } from '../Helper/shallowIs';

function id<T>(x: T) {
  return x;
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
            state: this.state.state,
          }}
        >
          {this.props.children}
        </Provider>
      );
    }
  }

  class Indirection<R> extends React.Component<{
    state: R;
    shouldUpdate: (oldValue: R, newValue: R) => boolean;
    children: (
      store: {
        state: R;
        dispatch: Dispatch;
      },
    ) => React.ReactNode;
  }> {
    static defaultProps = {
      shouldUpdate: (a: unknown, b: unknown) => !shallowIs(a, b),
    };
    shouldComponentUpdate(prevProps: {
      state: R;
      shouldUpdate: (oldValue: R, newValue: R) => boolean;
      dispatch: Dispatch;
      children: (
        store: {
          state: R;
          dispatch: Dispatch;
        },
      ) => React.ReactNode;
    }) {
      return this.props.shouldUpdate(prevProps.state, this.props.state);
    }
    render() {
      return this.props.children({
        dispatch: store.dispatch,
        state: this.props.state,
      });
    }
  }

  function ReduxConsumer<R = State>(props: {
    selector?: ((state: State) => R);
    /**
     * defaults to shallow comparing selector
     */
    shouldUpdate?: (oldValue: R, newValue: R) => boolean;
    children: (
      store: {
        state: R;
        dispatch: Dispatch;
      },
    ) => React.ReactNode;
  }) {
    const {
      selector = id as (s: State) => State,
      children,
      shouldUpdate,
    } = props;
    return (
      <Consumer>
        {({ state }) => {
          return (
            <Indirection
              state={selector(state)}
              shouldUpdate={shouldUpdate}
              children={children}
            />
          );
        }}
      </Consumer>
    );
  }
  return { StoreProvider: ReduxStore, StoreConsumer: ReduxConsumer };
}
