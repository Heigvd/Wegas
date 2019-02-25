import * as React from 'react';

type PromiseStatus = 'pending' | 'resolved' | 'rejected';
type ReducerData<O> =
    | {
          data: null;
          error: null;
          status: 'pending';
      }
    | {
          data: O;
          error: null;
          status: 'resolved';
      }
    | {
          data: null;
          error: Error;
          status: 'rejected';
      };
interface ReducerAction<O> {
    type: PromiseStatus;
    payload: O | Error;
}
function reducer<O>(state: ReducerData<O>, action: ReducerAction<O>) {
    switch (action.type) {
        case 'pending':
            return {
                error: null,
                data: null,
                status: action.type,
            };
        case 'resolved':
            return {
                error: null,
                data: action.payload as O,
                status: action.type,
            };
        case 'rejected': {
            return {
                error: action.payload as Error,
                data: null,
                status: action.type,
            };
        }
        default:
            return state;
    }
}
export function useAsync<O>(promise: Promise<O> | O, deps: Readonly<unknown[]> = []) {
    const [data, dispatch] = React.useReducer<
        React.Reducer<ReducerData<O>, ReducerAction<O>>
    >(reducer, {
        error: null,
        data: null,
        status: 'pending',
    });
    React.useEffect(() => {
        let alive = true;
        Promise.resolve(promise).then(
            result => alive && dispatch({ type: 'resolved', payload: result }),
            error => alive && dispatch({ type: 'rejected', payload: error })
        );
        return () => {
            alive = false;
        };
    }, deps);
    return data;
}
