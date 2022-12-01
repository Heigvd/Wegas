import * as React from 'react';

export interface CenteredProps<T> extends ClassStyleId {
  children?: T;
}

export function Centered<T = React.ReactNode>({
  className,
  style,
  children,
}: CenteredProps<T>) {
  return (
    <div className={className} style={{ margin: 'auto', ...style }}>
      {children}
    </div>
  );
}
