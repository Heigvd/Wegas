import { WidgetProps } from 'jsoninput/typings/types';
import * as React from 'react';
import { RGBColor } from 'react-color';
import {
  ColorPicker,
  rgbaToString,
} from '../Theme/Components/Theme/ColorPicker';
import { CommonView, CommonViewContainer } from './commonView';
import { Labeled, LabeledView } from './labeled';

export interface ColorPickerProps
  extends WidgetProps.BaseProps<
    {
      disabled?: boolean;
    } & CommonView &
      LabeledView
  > {
  value?: string;
  onChange: (value: string) => void;
}

export default function ColorPickerView({
  value,
  onChange,
  view,
  errorMessage,
}: ColorPickerProps) {
  const onChangeCb = React.useCallback(
    (value: RGBColor) => {
      const color = rgbaToString(value);
      onChange(color);
    },
    [onChange],
  );

  return (
    <CommonViewContainer errorMessage={errorMessage} view={view}>
      <Labeled {...view}>
        {({ labelNode }) => {
          return (
            <>
              {labelNode}
              {view.disabled || view.readOnly ? (
                value
              ) : (
                <ColorPicker
                  initColor={value || 'black'}
                  onChange={onChangeCb}
                />
              )}
            </>
          );
        }}
      </Labeled>
    </CommonViewContainer>
  );
}
