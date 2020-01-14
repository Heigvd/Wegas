import * as React from 'react';
import { css, cx } from 'emotion';

const listStyle = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-start',
  width: '100%',
  height: '100%',
});
const horizontalStyle = css({
  display: 'flex',
  // display: 'table',
  // width: '100%',
});
const horizontalChildren = (shrink?: boolean) =>
  css({
    display: 'table-cell',
    verticalAlign: 'middle',
    flex: shrink ? undefined : '1 1 0',
  });
const verticalStyle = css({
  flexDirection: 'column',
  '&>div': {
    width: '100%',
  },
  // width: '100%',
});

export interface ListProps<T> {
  /**
   * children - the items to display
   */
  children: T[];
  /**
   * style - specific style for the component
   */
  style?: React.CSSProperties;
  /**
   * className - specific className for the component
   */
  className?: string;
  /**
   * horizontal - the component orientation
   */
  horizontal?: boolean;
  /**
   * shrink - if true, the items wont be equally spread out
   */
  shrink?: boolean;
}
/**
 * Flex list.
 */
export default function List<T = React.ReactChild>({
  children,
  horizontal = false,
  className,
  style,
  shrink,
}: ListProps<T>) {
  return (
    <div
      style={style /* ? style : { flex: '1 1 auto' } */}
      className={cx(
        listStyle,
        {
          [horizontalStyle]: horizontal,
          [verticalStyle]: !horizontal,
        },
        className,
      )}
    >
      {horizontal
        ? children.map((c, i) => (
            <div key={i} className={horizontalChildren(shrink)}>
              {c}
            </div>
          ))
        : children}
    </div>
  );
}
