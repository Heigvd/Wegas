import * as React from 'react';
import { css, cx } from 'emotion';

const style = css({
  display: 'flex',
  flexWrap: 'wrap',
  flexDirection: 'column',
  alignItems: 'flex-start',
});
const horizontalStyle = css({
  flexDirection: 'row',
});

interface Props {
  children: React.ReactElement<any>[];
  /**
   * List direction, default vertical
   */
  horizontal?: boolean;
}
/**
 * Flex list.
 */
export default function List({ children, horizontal = false }: Props) {
  return (
    <div className={cx(style, { [horizontalStyle]: horizontal })}>
      {children}
    </div>
  );
}
