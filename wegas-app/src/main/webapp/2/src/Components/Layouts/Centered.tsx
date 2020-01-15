import * as React from 'react';

export interface CenteredProps<T> {
  children?: T;
  className?: string;
}

export function Centered<T = React.ReactNode>({
  className,
  children,
}: CenteredProps<T>) {
  return (
    <div className={className} style={{ margin: 'auto' }}>
      {children}
    </div>
  );
}
