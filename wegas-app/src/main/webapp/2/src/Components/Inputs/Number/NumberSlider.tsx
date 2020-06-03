import * as React from 'react';
import { Interpolation, css } from 'emotion';
import Slider from 'react-input-slider';
import { textCenter } from '../../../css/classes';
import { CheckMinMax } from './numberComponentHelper';
import { themeVar } from '../../Style/Theme';
import { Value } from '../../Outputs/Value';
import { InputProps } from '../SimpleInput';
import { NumberInput } from './NumberInput';
import { classNameOrEmpty } from '../../../Helper/className';

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

export type TriggerEvent = 'Change' | 'DragStart' | 'DragEnd' | 'NumberInput';

export interface NumberSliderProps
  extends Omit<InputProps<number>, 'onChange'> {
  /**
   * onChange - return the value set by the component
   */
  onChange?: (value: number, triggerEvent: TriggerEvent) => void;
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
  const refValue = React.useRef(value || 0);
  React.useEffect(
    () => {
      if (value) {
        refValue.current = value;
        setValue(value || 0);
      }
    },
    // eslint-disable-next-line
    [value],
  );

  const onSliderChange = React.useCallback(
    (value: number, trigger: TriggerEvent) => {
      if (trigger === 'Change' || trigger === 'NumberInput') {
        refValue.current = value;
        setValue(value);
      }
      !readOnly && onChange && onChange(value, trigger);
    },
    [onChange, readOnly],
  );

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
          display = (
            <NumberInput
              value={value}
              onChange={v => onSliderChange(v, 'NumberInput')}
            />
          );
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
    <div id={id} className={textCenter + classNameOrEmpty(className)}>
      {label && <Value value={label} />}
      <CheckMinMax min={min} max={max} value={internalValue} />
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
        onChange={({ x }) => onSliderChange(x, 'Change')}
        onDragEnd={() =>
          !readOnly && onChange && onChange(refValue.current, 'DragEnd')
        }
        disabled={disabled}
      />
    </div>
  );
}
