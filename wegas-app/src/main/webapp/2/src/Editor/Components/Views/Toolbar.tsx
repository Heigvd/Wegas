import * as React from 'react';
import { css } from 'glamor';

const grid = css({
  display: 'grid',
  height: '100%',
  gridTemplateColumns: 'auto',
});
const toolbarFirst = css({
  gridTemplateRows: 'auto 1fr',
});
const toolbarLast = css({
  gridTemplateRows: '1fr auto',
});
const autoOverflow = css({
  height: '100%',
  overflow: 'auto',
  minHeight: '5em',
  maxHeight: '100%',
});

export function WithToolbar(props: { children: React.ReactElement<{}>[] }) {
  if (props.children.length !== 2) {
    throw Error('WithToolbar requires exactly 2 children');
  }

  let clName;
  if (
    props.children[0].type === WithToolbar.Toolbar &&
    props.children[1].type === WithToolbar.Content
  ) {
    clName = toolbarFirst.toString();
  } else if (
    props.children[1].type === WithToolbar.Toolbar &&
    props.children[0].type === WithToolbar.Content
  ) {
    clName = toolbarLast.toString();
  } else {
    throw Error(
      'WithToolbar requires a child of type WithToolbar.Toolbar and one of type WithToolbar.Content',
    );
  }
  return (
    <div {...grid} className={clName}>
      {props.children}
    </div>
  );
}
export namespace WithToolbar {
  export const Toolbar = function Toolbar(props: {
    children: React.ReactNode[] | React.ReactNode;
  }) {
    return <div>{props.children}</div>;
  };
  export const Content = function Content(props: {
    children: React.ReactNode[] | React.ReactNode;
  }) {
    return <div {...autoOverflow}>{props.children}</div>;
  };
}
