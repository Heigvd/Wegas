import * as React from 'react';
import { css, cx } from 'emotion';

const listStyle = css({
  display: 'flex',
  flexWrap: 'wrap',
  flexDirection: 'column',
  alignItems: 'flex-start',
});
const horizontalStyle = css({
  flexDirection: 'row',
});

interface Props {
  children: WegasComponent[];
  style?: React.CSSProperties;
  /**
   * List direction, default vertical
   */
  horizontal?: boolean;
}
/**
 * Flex list.
 */
export default function List({ children, horizontal = false, style }: Props) {
  return (
    <div
      style={style}
      className={cx(listStyle, { [horizontalStyle]: horizontal })}
    >
      {children}
    </div>
  );
}
