import * as React from 'react';
import StringInput, { StringInputProps } from './String';

export default function Textarea(props: StringInputProps) {
  const { view } = props;
  return <StringInput {...props} view={{ rows: 4, ...view }} />;
}
