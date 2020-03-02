import * as React from 'react';

export interface ValueProps {
  value: string | number | object;
  className?: string;
}

export function Value({ value, className }: ValueProps) {
  return (
    <div className={className}>
      {typeof value === 'object' ? JSON.stringify(value) : value}
    </div>
  );
}
