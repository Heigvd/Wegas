import * as React from 'react';
import { css, cx } from 'emotion';

const listStyle = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-start',
});
const horizontalStyle = css({
  flexDirection: 'row',
  '&>div': {
    height: '100%',
  },
});
const verticatStyle = css({
  flexDirection: 'column',
  '&>div': {
    width: '100%',
  },
});

export interface ListProps {
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
export default function List({
  children,
  horizontal = false,
  style,
}: ListProps) {
  return (
    <div
      style={style}
      className={cx(listStyle, {
        [horizontalStyle]: horizontal,
        [verticatStyle]: !horizontal,
      })}
    >
      {children}
    </div>
  );
}
