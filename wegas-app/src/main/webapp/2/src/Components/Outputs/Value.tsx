import * as React from 'react';
import { titleStyle } from '../../Editor/Components/FormView/labeled';
import { cx } from 'emotion';
import { flexRow, flex } from '../../css/classes';

export interface ValueProps {
  value: string | number | object;
  label?: string;
  className?: string;
}

export function Value({ value, label, className }: ValueProps) {
  return (
    <div className={cx(flex, flexRow)}>
      {label && (
        <label className={titleStyle} htmlFor={label} title={label}>
          <span style={{ display: 'inline-flex' }}>{label} : </span>
        </label>
      )}
      <div className={className}>
        {typeof value === 'string' ? value : JSON.stringify(value)}
      </div>
    </div>
  );
}
