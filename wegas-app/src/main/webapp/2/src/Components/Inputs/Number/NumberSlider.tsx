import * as React from 'react';
import { Interpolation, css } from 'emotion';
import Slider from 'react-input-slider';
import { textCenter } from '../../../css/classes';
import { checkMinMax } from './numberComponentHelper';
import { themeVar } from '../../Theme';
import { Value } from '../../Outputs/Value';
import { InputProps } from '../SimpleInput';
import { NumberInput } from './NumberInput';

const valueDisplayStyle = css({
  textAlign: 'center',
  padding: '5px',
});

export const displayModes = [
  'None',
  'External',
  'Internal',
  'Both',
  'NumberInput',
] as const;
export type DisplayMode =
  | typeof displayModes[number]
  | ((internalValue: number, inputValue?: number) => React.ReactNode);

export interface NumberSliderProps extends InputProps<number> {
  /**
   * max - the maximum value to slide (100 by default)
   */
  max: number;
  /**
   * min - the minimum value to slide (0 by default)
   */
  min: number;
  /**
   * label - the current label of the slider
   */
  label?: string;
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
  label,
  steps,
  displayValues,
  readOnly,
  disabled,
  rightPartStyle,
  leftPartStyle,
  handleStyle,
  className,
  id,
}: NumberSliderProps) {
  const [internalValue, setValue] = React.useState<number>(value || 0);

  React.useEffect(
    () => {
      if (value !== internalValue) {
        setValue(value || 0);
      }
    },
    // We don't need to refresh on internalValue change because it will be already done in the onChange function
    // eslint-disable-next-line
    [value /*internalValue,*/],
  );

  const onSliderChange = React.useCallback(
    value => {
      setValue(value);
      !readOnly && onChange && onChange(value);
    },
    [onChange, readOnly],
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
        case 'NumberInput':
          display = <NumberInput value={value} onChange={onSliderChange} />;
          break;
        case 'None':
        default:
          display = undefined;
          break;
      }
    } else if (typeof displayValues === 'function') {
      display = displayValues(internalValue, value);
    }
    return <div className={valueDisplayStyle}>{display}</div>;
  };

  return (
    <div id={id} className={className ? className : textCenter}>
      {label && <Value value={label} />}
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
        onChange={({ x }) => onSliderChange(x)}
        disabled={disabled}
      />
    </div>
  );
}
