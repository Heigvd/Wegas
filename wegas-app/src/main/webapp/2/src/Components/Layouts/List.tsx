import * as React from 'react';
import { css, cx } from 'emotion';
import { Centered } from './Centered';
import { classNameOrEmpty } from '../../Helper/className';
import { themeVar } from '../Theme/ThemeVars';

export const layoutHighlightStyle = css({
  borderStyle: 'solid',
  borderWidth: '2px',
  borderColor: themeVar.Common.colors.HighlightColor,
});

const listStyle = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-start',
  width: '100%',
  height: '100%',
});
const horizontalStyle = css({
  display: 'inline-flex',
});
const horizontalChildren = (shrink?: boolean) =>
  css({
    display: 'table-cell',
    verticalAlign: 'middle',
    flex: shrink ? undefined : '1 1 0',
  });
const verticalStyle = css({
  flexDirection: 'column',
  // '&>div': {
  //   width: '100%',
  // },
  // width: '100%',
});

export interface OrientedLayoutProps<T> extends ClassStyleId {
  /**
   * children - the items to display
   */
  children: T[];
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
      className={
        cx(listStyle, {
          [horizontalStyle]: horizontal,
          [verticalStyle]: !horizontal,
        }) + classNameOrEmpty(className)
      }
    >
      {children.map((c, i) => {
        return horizontal ? (
          <div
            key={i}
            style={{ margin: centered ? 'auto' : undefined }}
            className={horizontalChildren(shrink)}
          >
            {c}
          </div>
        ) : centered ? (
          <Centered>{c}</Centered>
        ) : (
          c
        );
      })}
    </div>
  );
}
