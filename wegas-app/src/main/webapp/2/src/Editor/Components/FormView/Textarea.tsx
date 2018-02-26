import * as React from 'react';
import StringInput from './String';
import { WidgetProps } from 'jsoninput/typings/types';

export default function Textarea(
  props: WidgetProps.BaseProps<'string'> & { value: string },
) {
  const { view } = props;
  return <StringInput {...props} view={{ rows: 4, ...view }} />;
}
