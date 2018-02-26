import * as React from 'react';
import StringView from './String';
import { WidgetProps } from 'jsoninput/typings/types';

function noop() {}

export default function Uneditable(props: WidgetProps.BaseProps<any>) {
  const { view, value } = props;
  return (
    <StringView
      {...props}
      view={{ ...view, readOnly: true }}
      value={JSON.stringify(value)}
      onChange={noop}
    />
  );
}
