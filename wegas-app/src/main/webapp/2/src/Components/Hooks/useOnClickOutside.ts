import * as React from 'react';

export function useOnClickOutside(
  ref: React.RefObject<HTMLElement>,
  cb: () => void,
) {
  React.useEffect(() => {
    const listener = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (ref.current && !ref.current.contains(target)) {
        cb();
      }
    };
    window.addEventListener('mousedown', listener);
    return () => {
      window.removeEventListener('mousedown', listener);
    };
  }, [ref, cb]);
}
