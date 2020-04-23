import * as React from 'react';
import { cx, css } from 'emotion';
import { classNameOrEmpty } from '../../Helper/className';
import { flex, flexColumn, flexRow } from '../../css/classes';
import { themeVar } from '../Theme';

const splitterStyle = css({
  backgroundColor: themeVar.primaryLighterColor,
});

interface FlexLayoutProps extends ClassAndStyle {
  vertical?: boolean;
}

interface FlexLayoutSplitterProps extends ClassAndStyle {
  size?: number;
}

interface FlexLayoutContentProps extends ClassAndStyle {
  initFlex?: number;
}

export function useFlexLayout(vertical?: boolean) {
  return {
    FlexLayout: function ({
      className,
      style,
      children,
    }: React.PropsWithChildren<FlexLayoutProps>) {
      return (
        <div
          className={
            cx(flex, vertical ? flexColumn : flexRow) +
            classNameOrEmpty(className)
          }
          style={style}
        >
          {React.Children.map(children, c => {
            return typeof c;
          })}
        </div>
      );
    },
    Splitter: function ({
      size = 5,
      className = splitterStyle,
      style,
    }: FlexLayoutSplitterProps) {
      return (
        <div
          style={{
            ...(vertical
              ? { height: `${size}px`, width: 'auto', cursor: 'row-resize' }
              : { height: 'auto', width: `${size}px`, cursor: 'col-resize' }),
            ...style,
          }}
          className={className}
        />
      );
    },
    Content: function ({
      initFlex = 1,
      className,
      style,
      children,
    }: React.PropsWithChildren<FlexLayoutContentProps>) {
      const [flex, setFlex] = React.useState(initFlex);
      return (
        <div className={className} style={{ flexGrow: flex, ...style }}>
          {children}
        </div>
      );
    },
  };
}
