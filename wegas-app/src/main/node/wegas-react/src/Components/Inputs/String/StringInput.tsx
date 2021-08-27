import * as React from 'react';
import { SimpleInputProps, SimpleInput } from '../SimpleInput';

export interface StringInputProps extends SimpleInputProps {
  /**
   * value - the value to input
   */
  value?: string;
}

export function StringInput(props: StringInputProps) {
  return <SimpleInput {...props} />;
}
