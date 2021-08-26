import * as React from 'react';
import { Labeled, LabeledView } from './labeled';
import { WidgetProps } from 'jsoninput/typings/types';
import { CommonViewContainer, CommonView } from './commonView';
import { SimpleInput } from '../../../Components/Inputs/SimpleInput';

export interface NumberInputProps
  extends WidgetProps.BaseProps<
    {
      rows?: number;
      disabled?: boolean;
      placeholder?: string;
      fullWidth?: boolean;
    } & CommonView &
      LabeledView
  > {
  value?: number;
  onChange: (value: number) => void;
}

export default function NumberInput({
  value,
  onChange,
  view,
  errorMessage,
}: NumberInputProps) {
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
                inputType="number"
              />
            </>
          );
        }}
      </Labeled>
    </CommonViewContainer>
  );
}
