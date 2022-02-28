/**
 * POC, would need to check if context pass through correctly.
 * Maybe Mem leak
 */
import { css } from '@emotion/css';
import * as React from 'react';
import { createPortal } from 'react-dom';
import ResizeObserver from 'resize-observer-polyfill';

const ctx =
  React.createContext<
    undefined | ((children: React.ReactNode, id: string) => HTMLDivElement)
  >(undefined);
/**
 * React Component.
 *
 * Removing that node also destroys `Reparentable`s' state
 */
export function ReparentableRoot({ children }: { children: React.ReactNode }) {
  const [cache, setCache] = React.useState<
    Record<string, [React.ReactNode, HTMLDivElement, string]>
  >({});
  const getNode = React.useCallback(
    function getNode(child: React.ReactNode, id: string) {
      if (id == null) {
        throw Error('A key is required');
      }
      if (!cache[id]) {
        const n = document.createElement('div');
        setCache(c => ({ ...c, [id]: [child, n, id] }));
        return n;
      } else if (cache[id][0] !== child) {
        setCache(c => ({ ...c, [id]: [child, cache[id][1], id] }));
      }

      return cache[id][1];
    },
    [cache],
  );
  // Empty cache on destroy
  React.useEffect(() => () => setCache({}), []);
  return (
    <ctx.Provider value={getNode}>
      {Object.values(cache).map(c => createPortal(...c))}
      {children}
    </ctx.Provider>
  );
}

const sizeDisplayStyle = css({
  position: 'fixed',
  zIndex: 99,
});

/**
 * React Component.
 *
 * This can be moved inside a `ReparentableRoot` component.
 * It's children would keep their state
 */
export function Reparentable({
  id,
  children,
  innerClassName,
  outerClassName,
}: {
  /**
   * Identifies a Reparentable Component relatively to it's enclosing `ReparentableRoot`.
   * Must be unique between different Reparentable sharing the same enclosing `ReparentableRoot`.
   */
  id: string;
  children: React.ReactNode;
  innerClassName?: string;
  outerClassName?: string;
}) {
  const getNode = React.useContext(ctx);

  const resizeObserver = React.useRef<ResizeObserver | undefined>();
  const sizeDisplayRef = React.useRef<HTMLDivElement>(null);
  const n = React.useRef<HTMLDivElement>();

  if (getNode == null) {
    throw new Error(
      `${Reparentable.name} must be enclosed by a ${ReparentableRoot.name}`,
    );
  }
  React.useEffect(() => {
    const node = getNode(children, id);
    const container = n.current;
    if (container) {
      node.className = innerClassName ? innerClassName : '';
      container.appendChild(node);
      return () => {
        if (node.parentNode === container) {
          container.removeChild(node);
        }
      };
    }
  }, [n, innerClassName, getNode, children, id]);

  const setRef = React.useCallback((element: HTMLDivElement | null) => {
    if (resizeObserver.current != null) {
      resizeObserver.current.disconnect();
    }

    if (element != null) {
      n.current = element;
      let timer: number | undefined;

      const ro = new ResizeObserver(() => {
        if (sizeDisplayRef.current != null && n.current != null) {
          const rect = n.current.getBoundingClientRect();
          sizeDisplayRef.current.innerText = `${rect.width.toFixed()}x${rect.height.toFixed()}`;
          sizeDisplayRef.current.style.right = `${
            window.innerWidth - rect.right
          }px`;
          sizeDisplayRef.current.style.top = `${rect.top}px`;
          if (timer != null) {
            clearTimeout(timer);
          }

          timer = window.setTimeout(() => {
            if (sizeDisplayRef.current != null) {
              sizeDisplayRef.current.innerText = '';
            }
          }, 500);
        }
      });

      ro.observe(n.current);
      resizeObserver.current = ro;
    }
  }, []);

  return (
    <>
      <div className={sizeDisplayStyle} ref={sizeDisplayRef}></div>
      <div ref={setRef} className={outerClassName} />
    </>
  );
}
