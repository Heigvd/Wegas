import * as React from 'react';
import { Interpolation, css } from 'emotion';
import Slider from 'react-input-slider';
import { textCenter } from '../../../css/classes';
import { debounce } from 'lodash-es';
import { checkMinMax } from './numberComponentHelper';
import { themeVar } from '../../Theme';

const valueDisplayStyle = css({
  textAlign: 'center',
  padding: '5px',
});

export const displayModes = ['None', 'External', 'Internal', 'Both'] as const;
export type DisplayMode =
  | typeof displayModes[number]
  | ((value: number, internalValue: number) => React.ReactNode);

export interface NumberSliderProps {
  /**
   * value - the current value of the slider
   */
  value: number;
  /**
   * onChange - callback when the slider is used
   * if onChange is not sat, the component will automatically be read-only
   */
  onChange?: (value: number) => void;
  /**
   * max - the maximum value to slide (100 by default)
   */
  max: number;
  /**
   * min - the minimum value to slide (0 by default)
   */
  min: number;
  /**
   * steps - the number of steps between min and max value. 100 by default.
   */
  steps?: number;
  /**
   * displayValue - displays the values in the slider
   * Can be a string or a formatting function that takes the value and return a string
   */
  displayValues?: DisplayMode;
  /**
   * disabled - set the component in disabled mode
   */
  disabled?: boolean;
  /**
   * trackStyle - the style of the track
   */
  rightPartStyle?: Interpolation;
  /**
   * leftPartStyle - the style of the left part of the track
   */
  leftPartStyle?: Interpolation;
  /**
   * handleStyle - the style of the slider handle
   */
  handleStyle?: Interpolation;
}

const desinterpolate = (style?: Interpolation) =>
  style
    ? Object.keys(style).reduce(
        (o, k: keyof Interpolation) => ({
          ...o,
          [k]: style[k],
        }),
        {},
      )
    : undefined;

export function NumberSlider({
  value,
  onChange,
  max,
  min,
  steps,
  displayValues,
  disabled,
  rightPartStyle,
  leftPartStyle,
  handleStyle,
}: NumberSliderProps) {
  const [internalValue, setValue] = React.useState(value);

  React.useEffect(
    () => {
      if (value !== internalValue) {
        setValue(value);
      }
    },
    // We don't need to refresh on internalValue change because it will be already done in the onChange function
    // eslint-disable-next-line
    [value /*internalValue,*/],
  );

  const onSliderChange = React.useCallback(
    debounce((value: number) => {
      onChange && onChange(value);
    }, 100),
    [onChange],
  );

  const minMaxCheck = checkMinMax(min, max, internalValue);
  if (minMaxCheck !== undefined) {
    return minMaxCheck;
  }

  const Info = () => {
    let display;
    if (displayValues == null) {
      display = null;
    } else if (typeof displayValues === 'string') {
      switch (displayValues) {
        case 'External':
          display = value;
          break;
        case 'Internal':
          display = internalValue;
          break;
        case 'Both':
          display = (
            <>
              <div>External value : {value}</div>
              <div>Internal value : {internalValue}</div>
            </>
          );
          break;
        case 'None':
        default:
          display = undefined;
          break;
      }
    } else if (typeof displayValues === 'function') {
      display = displayValues(value, internalValue);
    }
    return <div className={valueDisplayStyle}>{display}</div>;
  };

  return (
    <div className={textCenter}>
      <Info />
      <Slider
        styles={{
          track: desinterpolate(rightPartStyle),
          active: leftPartStyle
            ? desinterpolate(leftPartStyle)
            : desinterpolate({ backgroundColor: themeVar.primaryLighterColor }),
          thumb: handleStyle
            ? desinterpolate(handleStyle)
            : css({ cursor: 'pointer' }),
        }}
        axis="x"
        xmax={max}
        xmin={min}
        xstep={Math.abs(max - min) / (steps ? steps : 100)}
        x={internalValue}
        onChange={({ x }) => {
          setValue(x);
          onSliderChange(x);
        }}
        disabled={disabled}
      />
    </div>
  );
}
