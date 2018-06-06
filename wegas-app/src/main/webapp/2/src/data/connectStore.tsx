import * as React from 'react';
import { Store } from 'redux';
import { shallowIs } from '../Helper/shallowIs';

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
            return <Indirection state={selector!(state)} children={children} />;
          }}
        </Consumer>
      );
    }
  }
  return { StoreProvider: ReduxStore, StoreConsumer: ReduxConsumer };
}
