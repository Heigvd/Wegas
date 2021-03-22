import * as React from 'react';
import StringInput, { StringInputProps } from './String';

export interface TimestampProps extends StringInputProps {
  value?: number;
}

export function TimestampView(props: TimestampProps) {
  const date = props.value ? new Date(props.value) : new Date();
  const dateValue = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  return <StringInput {...props} value={dateValue} />;
}
