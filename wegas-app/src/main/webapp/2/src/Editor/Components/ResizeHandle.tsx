import * as React from 'react';
import { cx } from 'emotion';
import {
  flex,
  flexColumn,
  grow,
  expandBoth,
  centeredContent,
  schrink,
} from '../../css/classes';
import { IconButton } from '../../Components/Inputs/Buttons/IconButton';

interface ResizeHandleProps {
  minSize?: number;
}

export function ResizeHandle({
  minSize,
  children,
}: React.PropsWithChildren<ResizeHandleProps>) {
  const container = React.useRef<HTMLDivElement>(null);
  const [moving, setMoving] = React.useState(false);
  const [clientY, setClientY] = React.useState<number | undefined>(minSize);

  const mouseUpListener = React.useCallback(() => setMoving(false), []);

  React.useEffect(() => {
    window.addEventListener('mouseup', mouseUpListener);
    return () => window.removeEventListener('mouseup', mouseUpListener);
  });

  return (
    <div
      ref={container}
      style={{ height: clientY ? clientY : '100%' }}
      className={cx(flex, flexColumn)}
    >
      <div className={cx(flex, grow, expandBoth)}>{children}</div>
      <div className={cx(centeredContent)}>
        <div className={cx(schrink)}>
          <IconButton
            icon={['circle', { color: 'white', icon: 'caret-down' }]}
            onMouseDown={() => setMoving(true)}
            onMouseMove={e => {
              if (moving) {
                const cont = container.current;
                if (cont != null) {
                  const containerRect = e.currentTarget.parentElement!.parentElement!.parentElement!.getBoundingClientRect();
                  const targetRect = e.currentTarget.getBoundingClientRect();
                  const event_offsetY = e.pageY - containerRect.top;
                  const targetRect_offsetY = e.pageY - targetRect.top;

                  if (
                    targetRect_offsetY < 0 ||
                    targetRect_offsetY > targetRect.height
                  ) {
                    setMoving(false);
                  }

                  setClientY(
                    event_offsetY +
                      e.currentTarget.clientHeight -
                      targetRect.height / 2,
                  );
                }
              }
            }}
            onMouseUp={() => setMoving(false)}
          />
        </div>
      </div>
    </div>
  );
}
