import * as React from 'react';
import { Labeled, LabeledView } from './labeled';
import { WidgetProps } from 'jsoninput/typings/types';
import { CommonViewContainer, CommonView } from './commonView';
import { SimpleInput } from '../../../Components/Inputs/SimpleInput';

export interface StringInputProps
  extends WidgetProps.BaseProps<
    {
      rows?: number;
      disabled?: boolean;
      placeholder?: string;
    } & CommonView &
      LabeledView
  > {
  value?: string | number;
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
        {({ inputId, labelNode }) => (
          <>
            {labelNode}
            <SimpleInput
              value={value}
              onChange={onChange}
              disabled={view.disabled}
              readOnly={view.readOnly}
              placeholder={view.placeholder}
              id={inputId}
            />
          </>
        )}
      </Labeled>
    </CommonViewContainer>
  );
}
