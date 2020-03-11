import * as React from 'react';
import { cx } from 'emotion';
import {
  flex,
  flexColumn,
  grow,
  expandBoth,
  centeredContent,
  shrinkWidth,
} from '../../css/classes';
import { IconButton } from '../../Components/Inputs/Buttons/IconButton';

interface ResizeHandleProps {
  minSize: number;
  maxSize?: number;
  textContent?: string;
  lineHeight?: number;
}

const handleHeight = 28;

export function ResizeHandle({
  minSize,
  maxSize,
  textContent,
  lineHeight = 19,
  children,
}: React.PropsWithChildren<ResizeHandleProps>) {
  const [open, setOpen] = React.useState(false);
  const computedMinSize = minSize ? minSize + 'px' : '100%';
  const textSize = textContent
    ? (textContent.split(/\n/).length + 1) * lineHeight + handleHeight
    : 0;
  const computedMaxSize =
    textContent || maxSize || minSize
      ? Math.max(textSize, maxSize || 0, minSize || 0) + 'px'
      : '100%';

  return (
    <div
      style={{ height: open ? computedMaxSize : computedMinSize }}
      className={cx(flex, flexColumn)}
    >
      <div className={cx(flex, grow, expandBoth)}>{children}</div>
      <div className={cx(centeredContent)}>
        <div className={cx(shrinkWidth)}>
          <IconButton
            icon={open ? 'angle-up' : 'angle-down'}
            onClick={() => setOpen(o => !o)}
          />
        </div>
      </div>
    </div>
  );
}
