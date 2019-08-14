import * as React from 'react';

function isNode(object: any): object is Node {
  for (const key in Node) {
    if (object[key] === undefined) {
      return false;
    }
  }
  return true;
}

export function useOnClickOutside(
  ref: React.RefObject<HTMLDivElement>,
  cb: () => void,
) {
  React.useEffect(() => {
    const listener = (e: MouseEvent) => {
      const target = e.target;
      if (ref.current && isNode(target) && !ref.current.contains(target)) {
        cb();
      }
    };
    window.addEventListener('mousedown', listener);
    return () => {
      window.removeEventListener('mousedown', listener);
    };
  }, [ref, cb]);
}
