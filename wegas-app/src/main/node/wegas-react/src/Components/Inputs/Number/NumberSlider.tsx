import { css, CSSInterpolation, cx } from '@emotion/css';
import * as React from 'react';
import {
  flex,
  flexColumn,
  halfOpacity,
  textCenter,
} from '../../../css/classes';
import { classNameOrEmpty } from '../../../Helper/className';
import { Value } from '../../Outputs/Value';
import { isActionAllowed } from '../../PageComponents/tools/options';
import { themeVar } from '../../Theme/ThemeVars';
import { InputProps } from '../SimpleInput';
import { CheckMinMax } from './numberComponentHelper';
import { NumberInput } from './NumberInput';
import Slider from './react-input-slider/react-number-slider';

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
  rightPartStyle?: CSSInterpolation;
  /**
   * leftPartStyle - the style of the left part of the track
   */
  leftPartStyle?: CSSInterpolation;
  /**
   * handleStyle - the style of the slider handle
   */
  handleStyle?: CSSInterpolation;
  placeholder?: string,
}

const desinterpolate = (style?: CSSInterpolation) =>
  style
    ? Object.keys(style).reduce(
      (o, k: keyof CSSInterpolation) => ({
        ...o,
        [k]: style[k],
      }),
      {},
    )
    : undefined;

export function NumberSlider({
  value,
  placeholder,
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

  const onNumberChange = React.useCallback(
    (value: number, trigger: TriggerEvent) => {
      if (trigger === 'Change' || trigger === 'NumberInput') {
        refValue.current = value;
        setValue(value);
      }
      !readOnly && onChange && onChange(value, trigger);
    },
    [onChange, readOnly],
  );

  const Info = React.useMemo(() => {
    let display;
    if (displayValues == null) {
      display = null;
    } else if (typeof displayValues === 'string') {
      switch (displayValues) {
        case 'External':
          display = (
            <div className={cx({ [halfOpacity]: disabled })}>{value}</div>
          );
          break;
        case 'Internal':
          display = (
            <div className={cx({ [halfOpacity]: disabled })}>
              {internalValue}
            </div>
          );
          break;
        case 'Both':
          display = (
            <div className={cx(flex, flexColumn, { [halfOpacity]: disabled })}>
              <div>External value : {value}</div>
              <div>Internal value : {internalValue}</div>
            </div>
          );
          break;
        case 'NumberInput':
          display = (
            <NumberInput
              value={internalValue}
              onChange={v => {
                onNumberChange(Math.min(Math.max(v, min), max), 'NumberInput');
              }}
              disabled={disabled}
              readOnly={readOnly}
              placeholder={placeholder}
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
  }, [disabled, displayValues, internalValue, max, min, onNumberChange, placeholder, readOnly, value]);

  const computedSteps = Math.abs(max - min) / (steps ?? 100);

  return (
    <div id={id} className={textCenter + classNameOrEmpty(className)}>
      {typeof label === 'string' ? <Value value={label} /> : label}
      <CheckMinMax min={min} max={max} value={internalValue} />
      {Info}
      <Slider
        styles={{
          track: desinterpolate(rightPartStyle),
          active: leftPartStyle
            ? desinterpolate(leftPartStyle)
            : desinterpolate({
              backgroundColor: themeVar.colors.PrimaryColor,
            }),
          thumb: handleStyle
            ? desinterpolate(handleStyle)
            : isActionAllowed({ readOnly, disabled })
              ? desinterpolate({ cursor: 'pointer' })
              : {},
          disabled: { opacity: 0.5 },
        }}
        axis="x"
        xmax={max}
        xmin={min}
        xstep={computedSteps}
        x={internalValue}
        onChange={({ x }) => {
          if (isActionAllowed({ readOnly, disabled })) {
            onNumberChange(parseFloat(x.toFixed(10)), 'Change');
          }
        }}
        onDragEnd={() =>
          !readOnly && onChange && onChange(refValue.current, 'DragEnd')
        }
        disabled={disabled}
      />
    </div>
  );
}
