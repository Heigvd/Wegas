import * as React from 'react';
import { CommonViewContainer, CommonView } from './commonView';
import { WidgetProps } from 'jsoninput/typings/types';
import { Labeled, LabeledView } from './labeled';
import { inputStyle } from './String';

export interface TimestampProps
  extends WidgetProps.BaseProps<
    {
      rows?: number;
      disabled?: boolean;
      placeholder?: string;
    } & CommonView &
      LabeledView
  > {
  value?: number;
}

export function TimestampView(props: TimestampProps) {
  const date = props.value ? new Date(props.value) : new Date();
  const value = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  return (
    <CommonViewContainer view={props.view} errorMessage={props.errorMessage}>
      <Labeled {...props.view}>
        {({ inputId, labelNode }) => (
          <>
            {labelNode}
            <input
              id={inputId}
              className={inputStyle}
              type="text"
              value={value}
              readOnly={true}
              disabled={true}
              autoComplete="off"
            />
          </>
        )}
      </Labeled>
    </CommonViewContainer>
  );
}
