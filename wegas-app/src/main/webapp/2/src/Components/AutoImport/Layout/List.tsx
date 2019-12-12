import * as React from 'react';
import { css, cx } from 'emotion';

const listStyle = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-start',
});
const horizontalStyle = css({
  display: 'table',
  width: '100%',
});
const horizontalChildren = css({
  display: 'table-cell',
  verticalAlign: 'middle',
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
  className?: string;
  horizontal?: boolean;
}
/**
 * Flex list.
 */
export default function List({
  children,
  horizontal = false,
  className,
  style,
}: ListProps) {
  return (
    <div
      style={style}
      className={
        className !== undefined
          ? className
          : cx(listStyle, {
              [horizontalStyle]: horizontal,
              [verticatStyle]: !horizontal,
            })
      }
    >
      {horizontal && className === undefined
        ? children.map((c, i) => (
            <div key={i} className={horizontalChildren}>
              {c}
            </div>
          ))
        : children}
    </div>
  );
}
