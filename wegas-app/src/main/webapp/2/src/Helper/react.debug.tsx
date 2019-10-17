/* eslint-disable no-console */
/**
 * @author Pierre-Benjamin Monaco
 * Inspired from from https://gist.github.com/sqren/780ae8ca1e2cf59050b0695c901b5aa3
 */
import * as React from 'react';

// TYPES
interface PropsCheckerProps<T> {
  children: (props: T) => React.ReactElement | null;
  childrenProps: T;
  compType?: ComparaisonTypes;
  verbose?: boolean;
}
interface Props {
  [key: string]: unknown;
}
type ComparaisonTypes = 'SIMPLE' | 'SHALLOW' | 'DEEP';

// COMPARAISON FUNCTIONS
function simpleCheck(a: unknown, b: unknown) {
  return a === b;
}
function shallowCheck(a: unknown, b: unknown, verbose?: boolean) {
  if (typeof a !== typeof b) {
    verbose && console.log('Not the same type');
    return false;
  }
  if (typeof a !== 'object') {
    return simpleCheck(a, b);
  }
  const A = a as Props;
  const B = b as Props;
  const keys = Object.keys(A);
  if (!deepCheck(A, B, verbose)) {
    verbose && console.log('Objects keys changed');
    return false;
  }
  for (const k in keys) {
    if (simpleCheck(A[k], B[k])) {
      verbose && console.log(`Object differ at key : ${k}`);
      return false;
    }
  }
  return true;
}
function deepCheck(a: unknown, b: unknown, verbose?: boolean) {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch (e) {
    verbose && console.log(e);
    return false;
  }
}
function compFNSelection(compType: ComparaisonTypes) {
  switch (compType) {
    case 'SIMPLE':
      return (a: unknown, b: unknown, _verbose?: boolean) => simpleCheck(a, b);
    case 'SHALLOW':
      return (a: unknown, b: unknown, verbose?: boolean) =>
        shallowCheck(a, b, verbose);
    case 'DEEP':
      return (a: unknown, b: unknown, verbose?: boolean) =>
        deepCheck(a, b, verbose);
    default:
      console.log('Comparaison type unvailable. Test will always return false');
      return () => false;
  }
}

/**
 * This component wraps another one and logs which props changed
 * Warning, this component is not meant to be used in production mode as it's slowing the rendering and using extra memory
 * @param WrappedComponent The component to analyse
 * @param compType The possible comparaison type (Be carefull with "DEEP". It may get errors in case of circular references)
 */
export function ReactFnCompPropsChecker<T extends Props>(
  props: PropsCheckerProps<T>,
) {
  const { children, childrenProps, compType = 'SIMPLE', verbose } = props;
  const oldPropsRef = React.useRef<T>();
  React.useEffect(() => {
    const oldProps = oldPropsRef.current;
    if (oldProps === undefined) {
      console.log('First render : ');
      Object.keys(childrenProps).map(k =>
        console.log(`${k} : ${childrenProps[k]}`),
      );
    } else {
      const changedProps = Object.keys(childrenProps)
        .filter(k =>
          compFNSelection(compType)(oldProps[k], childrenProps[k], verbose),
        )
        .map(k => `${k} : [OLD] ${oldProps[k]}, [NEW] ${childrenProps[k]}`);
      if (changedProps.length > 0) {
        console.log('Changed props : ');
        changedProps.map(console.log);
      } else {
        console.log('No props changed');
      }
    }
    oldPropsRef.current = childrenProps;
  }, [childrenProps, compType, verbose]);
  return children(childrenProps);
}
