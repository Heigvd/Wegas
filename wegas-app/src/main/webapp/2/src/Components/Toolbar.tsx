import * as React from 'react';
import { css } from 'glamor';

const flex = css({
  display: 'inline-flex',
  flexDirection: 'column',
  height: '100%',
  width: '100%',
});
const toolbar = css({
  flex: 'none',
});
const content = css({
  flex: '1 1 auto',
  overflowY: 'auto',
  height: 0,
});

export const Toolbar = Object.assign(
  (props: { children: React.ReactElement<{}>[] }) => {
    return <div {...flex}>{props.children}</div>;
  },
  {
    Header(props: { children?: React.ReactNode[] | React.ReactNode }) {
      return <div {...toolbar}>{props.children}</div>;
    },
    Content(props: { children?: React.ReactNode }) {
      return <div {...content}>{props.children}</div>;
    },
  },
);
