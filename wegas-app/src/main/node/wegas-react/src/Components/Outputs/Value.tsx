import { cx } from '@emotion/css';
import * as React from 'react';
import { flex, flexRow } from '../../css/classes';
import { titleStyle } from '../FormView/labeled';

export interface ValueProps extends ClassStyleId {
  value: string | number | object;
  label?: string;
}

export function Value({ value, label, className, style }: ValueProps) {
  return (
    <div className={cx(flex, flexRow)} style={style}>
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
