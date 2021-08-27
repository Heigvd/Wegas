import * as React from 'react';
import { css } from 'emotion';

const absolute = css({ position: 'absolute', zIndex: 1 });

const coverStyle = css({
  position: 'fixed',
  backgroundColor: 'rgba(0,0,0,0.3)',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
});

interface Props {
  children: React.ReactChild;
  zIndex?: number;
  onClick?: () => void;
}

export function Cover(props: Props) {
  // NB: The cover will not be dynamically readjusted if the frame is resized when the cover is displayed.
  return (
    <div className={css({ position: 'relative', zIndex: props.zIndex })}>
      <div className={coverStyle} onClick={props.onClick} />
      <div className={absolute}>{props.children}</div>
    </div>
  );
}
