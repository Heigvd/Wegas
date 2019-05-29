import * as React from 'react';
import StringView from './String';
import { WidgetProps } from 'jsoninput/typings/types';
import { CommonView } from './commonView';
import { LabeledView } from './labeled';

function noop() {}
type UneditableProps = WidgetProps.BaseProps<CommonView & LabeledView>;
export default function Uneditable(props: UneditableProps) {
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
