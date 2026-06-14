import React from "react";
import {css, cx} from "@emotion/css";

interface FlexProps {
  direction?: 'row' | 'column';
  className?: string;
  onClick?: () => void;
  shrink?: number;
  grow?: number;
  overflow?: 'clip' | 'auto' | 'visible' | 'scroll' | 'unset' | 'hidden';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  justify?:
    | 'center'
    | 'flex-start'
    | 'flex-end'
    | 'left'
    | 'right'
    | 'normal'
    | 'space-between'
    | 'space-evenly'
    | 'stretch';
  align?:
    | 'center'
    | 'stretch'
    | 'flex-start'
    | 'flex-end'
    | 'self-start'
    | 'self-end'
    | 'normal'
    | 'first'
    | 'first baseline'
    | 'last baseline';
  children: React.ReactNode;
}

export function Flex({
                       children,
                       onClick,
                       overflow,
                       className,
                       wrap,
                       shrink,
                       grow,
                       direction = 'row',
                       justify = 'normal',
                       align = 'normal',
                     }: FlexProps): JSX.Element {
  return (
    <div
      onClick={onClick}
      className={cx(
        css({
          display: 'flex',
          flexDirection: direction,
          [direction === 'column' ? 'overflowY' : 'overflowX']: overflow,
          justifyContent: justify,
          alignItems: align,
          flexShrink: shrink,
          flexGrow: grow,
          flexWrap: wrap,
        }),
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FitSpace(props: Omit<FlexProps, 'grow' | 'shrink'>): JSX.Element {
  return <Flex {...props} grow={1} shrink={1} />;
}
