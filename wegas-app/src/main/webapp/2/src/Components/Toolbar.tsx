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

export function Toolbar(props: { children: React.ReactElement<{}>[] }) {
  return (
    <div {...flex}>
      {props.children}
    </div>
  );
}
export namespace Toolbar {
  export const Header = function Toolbar(props: {
    children?: React.ReactNode[] | React.ReactNode;
  }) {
    return <div {...toolbar}>{props.children}</div>;
  };
  export const Content = function Content(props: {
    children?: React.ReactNode;
  }) {
    return <div {...content}>{props.children}</div>;
  };
}
