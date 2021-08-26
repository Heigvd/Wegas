import * as React from 'react';
import { Labeled, LabeledView } from './labeled';
import { WidgetProps } from 'jsoninput/typings/types';
import { CommonViewContainer, CommonView } from './commonView';
import {
  ColorPicker,
  rgbaToString,
} from '../../../Components/Theme/Components/Theme/ColorPicker';
import { RGBColor } from 'react-color';

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
