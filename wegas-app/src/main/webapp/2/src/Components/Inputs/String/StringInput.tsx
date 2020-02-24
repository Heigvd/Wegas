import * as React from 'react';
import { SimpleInputProps, SimpleInput } from '../SimpleInput';

export interface StringInputProps extends SimpleInputProps {
  value?: string;
}

export function StringInput(props: StringInputProps) {
  return <SimpleInput {...props} />;
}
