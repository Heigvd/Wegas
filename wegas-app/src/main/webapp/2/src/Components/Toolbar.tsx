import * as React from 'react';
import { css, cx } from 'emotion';

const flex = css({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
});
const vertical = css(flex, {
  flexDirection: 'row',
});
const toolbar = css({
  display: 'flex',
  [`.${vertical} > &`]: {
    flexDirection: 'column',
  },
});
const content = css({
  flex: '1 1 auto',
  overflow: 'auto',
  [`.${vertical} > &`]: {
    height: 'auto',
  },
});

export const Toolbar = Object.assign(
  function Toolbar(props: {
    vertical?: boolean;
    children: React.ReactElement<{}>[];
    className?: string;
  }) {
    return (
      <div
        className={cx(
          {
            [flex]: !props.vertical,
            [vertical]: Boolean(props.vertical),
          },
          props.className,
        )}
      >
        {props.children}
      </div>
    );
  },
  {
    Header(props: {
      children?: React.ReactNode[] | React.ReactNode;
      className?: string;
    }) {
      return (
        <div className={cx(toolbar, props.className)}>{props.children}</div>
      );
    },
    Content(props: { children?: React.ReactNode; className?: string }) {
      return (
        <div className={cx(flex, content, props.className)}>
          {props.children}
        </div>
      );
    },
  },
);
