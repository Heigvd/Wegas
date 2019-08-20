import * as React from 'react';
import { css, cx } from 'emotion';

const flex = css({
  display: 'flex',
  height: '100%',
  width: '100%',
});
const vertical = css(flex, {
  flexDirection: 'row',
});
const horizontal = css(flex, {
  flexDirection: 'column',
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
  height: 0,
  [`.${vertical} > &`]: {
    height: 'auto',
  },
});

export const Toolbar = Object.assign(
  function Toolbar(props: {
    vertical?: boolean;
    children: React.ReactElement<{}>[];
  }) {
    return (
      <div
        className={cx({
          [cx(horizontal, flex)]: !props.vertical,
          [vertical]: Boolean(props.vertical),
        })}
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
        <div className={cx(content, props.className, flex)}>
          {props.children}
        </div>
      );
    },
  },
);
