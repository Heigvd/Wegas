import { css, cx } from '@emotion/css';
import * as React from 'react';
import { flex, grow } from '../css/classes';
import { classNameOrEmpty } from '../Helper/className';

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
  [`.${vertical} > &`]: {
    height: 'auto',
  },
});

export const Toolbar = Object.assign(
  function Toolbar(
    props: {
      vertical?: boolean;
      children: React.ReactElement<UknownValuesObject>[];
      onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
    } & ClassStyleId,
  ) {
    return (
      <div
        className={
          cx({
            [cx(horizontal, flex, grow)]: !props.vertical,
            [vertical]: Boolean(props.vertical),
          }) + classNameOrEmpty(props.className)
        }
        style={props.style}
        onClick={props.onClick}
      >
        {props.children}
      </div>
    );
  },
  {
    Header(
      props: {
        children?: React.ReactNode[] | React.ReactNode;
      } & ClassStyleId,
    ) {
      return (
        <div
          className={toolbar + classNameOrEmpty(props.className)}
          style={props.style}
        >
          {props.children}
        </div>
      );
    },
    Content: React.forwardRef<
      HTMLDivElement,
      { children?: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>
    >(({ id, className, style, children, ...others }, ref) => {
      return (
        <div
          id={id}
          className={cx(flex, content) + classNameOrEmpty(className)}
          style={style}
          ref={ref}
          {...others}
        >
          {children}
        </div>
      );
    }),
  },
);
