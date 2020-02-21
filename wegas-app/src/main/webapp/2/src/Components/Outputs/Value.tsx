import * as React from 'react';

export interface ValueProps {
  value: string | number | object;
}

export function Value({ value }: ValueProps) {
  return <div>{typeof value === 'object' ? JSON.stringify(value) : value}</div>;
}
