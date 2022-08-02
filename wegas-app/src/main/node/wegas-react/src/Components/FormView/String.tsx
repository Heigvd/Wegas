import { WidgetProps } from 'jsoninput/typings/types';
import * as React from 'react';
import { SimpleInput } from '../Inputs/SimpleInput';
import { CommonView, CommonViewContainer } from './commonView';
import { Labeled, LabeledView } from './labeled';

export interface StringInputProps
  extends WidgetProps.BaseProps<
    {
      rows?: number;
      disabled?: boolean;
      placeholder?: string;
      fullWidth?: boolean;
    } & CommonView &
      LabeledView
  > {
  value?: string | number;
  onChange: (value: string) => void;
}

export default function StringInput({
  value,
  onChange,
  view,
  errorMessage,
}: StringInputProps) {
  return (
    <CommonViewContainer errorMessage={errorMessage} view={view}>
      <Labeled {...view}>
        {({ inputId, labelNode }) => {
          return (
            <>
              {labelNode}
              <SimpleInput
                value={value}
                onChange={onChange}
                disabled={view.disabled}
                readOnly={view.readOnly}
                placeholder={view.placeholder}
                id={inputId}
                fullWidth={view.fullWidth}
                rows={view.rows}
              />
            </>
          );
        }}
      </Labeled>
    </CommonViewContainer>
  );
}
