import * as React from 'react';
import { StoreConsumer, StoreDispatch } from '../data/store';
import { VariableDescriptor } from '../data/selectors';
import { getInstance } from '../data/methods/VariableDescriptor';

type instanceOf<D> = D extends IVariableDescriptor<infer U> ? U : never;

export function selectVar<T extends IVariableDescriptor>(name: string) {
  return function():
    | {
        descriptor: T;
        instance: instanceOf<T>;
      }
    | undefined {
    const descriptor = VariableDescriptor.first<T>('name', name);
    if (descriptor === undefined) {
      return undefined;
    }

    const instance = getInstance(descriptor)() as instanceOf<T>;
    return { descriptor, instance };
  };
}

export function VariableConnect<D extends IVariableDescriptor>(props: {
  name: string;
  children: (store: {
    state: { descriptor: D; instance: instanceOf<D> };
    dispatch: StoreDispatch;
  }) => React.ReactNode;
}) {
  return (
    <StoreConsumer selector={selectVar<D>(props.name)}>
      {({ state, dispatch }) => {
        if (state === undefined) {
          return <span>Not found: {props.name}</span>;
        }
        return props.children({ state, dispatch });
      }}
    </StoreConsumer>
  );
}

interface VariableMap<D> {
  [name: string]: { descriptor: D; instance: instanceOf<D> } | undefined;
}
export function VariablesConnect<D extends IVariableDescriptor>(props: {
  names: string[];
  children: (store: {
    state: VariableMap<D>;
    dispatch: StoreDispatch;
  }) => React.ReactNode;
}) {
  const vars: {
    [name: string]: () =>
      | { descriptor: D; instance: instanceOf<D> }
      | undefined;
  } = {};
  for (const name of props.names) {
    vars[name] = selectVar<D>(name);
  }
  const getVars = () => {
    const reduxVars: VariableMap<D> = {};
    for (const name of Object.keys(vars)) {
      reduxVars[name] = vars[name]();
    }
    return reduxVars;
  };
  return (
    <StoreConsumer selector={getVars}>
      {({ state, dispatch }) => {
        for (const name of Object.keys(state)) {
          if (state[name] === undefined) {
            return <span>Not found: {name}</span>;
          }
        }
        return props.children({ state, dispatch });
      }}
    </StoreConsumer>
  );
}
