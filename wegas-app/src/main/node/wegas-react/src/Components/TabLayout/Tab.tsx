import * as React from 'react';

type TabProps = React.PropsWithChildren<
  ClassStyleId &
    Pick<React.DOMAttributes<HTMLDivElement>, 'onClick' | 'onDoubleClick'>
>;

export const Tab = React.forwardRef<HTMLDivElement, TabProps>(
  (
    { onClick, onDoubleClick, id, style, className, children }: TabProps,
    ref: React.RefObject<HTMLDivElement>,
  ) => {
    return (
      <div
        ref={ref}
        id={id}
        style={style}
        className={className}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
      >
        {children}
      </div>
    );
  },
);

Tab.displayName = 'Tab';

export type TabComponent = typeof Tab;
