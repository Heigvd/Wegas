import * as React from 'react';
import { css, cx } from 'emotion';
import { Centered } from './Centered';
import { themeVar } from '../Theme';

export const layoutHighlightStyle = css({
  borderStyle: 'solid',
  borderWidth: '2px',
  borderColor: themeVar.searchColor,
});

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

export interface OrientedLayoutProps<T> {
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
}

export interface ListProps<T> extends OrientedLayoutProps<T> {
  /**
   * shrink - if true, the items wont be equally spread out
   */
  shrink?: boolean;
  /**
   * centered - if true, the items will be centered
   */
  centered?: boolean;
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
  centered,
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
      {children.map((c, i) => {
        const child = centered ? <Centered>{c}</Centered> : c;
        return horizontal ? (
          <div key={i} className={horizontalChildren(shrink)}>
            {child}
          </div>
        ) : (
          child
        );
      })}
    </div>
  );
}
