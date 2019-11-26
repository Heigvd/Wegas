import * as React from 'react';
// import Slider from 'react-input-slider';
import { Interpolation } from 'emotion';

// @ts-ignore
import Slider from 'react-input-slider';

interface SliderProps {
  axis?: 'x' | 'y' | 'xy';
  x?: number;
  xmax?: number;
  xmin?: number;
  y?: number;
  ymax?: number;
  ymin?: number;
  xstep?: number;
  ystep?: number;
  onChange?: (values: { x: number; y: number }) => void;
  onDragStart?: (e: MouseEvent) => void;
  onDragEnd?: (e: MouseEvent) => void;
  disabled?: boolean;
  styles?: {
    track?: Interpolation;
    active?: Interpolation;
    thumb?: Interpolation;
    disabled?: Interpolation;
  };
}

const TypedSlider = Slider as (props: SliderProps) => JSX.Element;

// const Slider =
//   // Using require in next line since no types are set yet for Slider
//   // eslint-disable-next-line @typescript-eslint/no-var-requires
//   require('react-input-slider');

interface NumberSliderProps {
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
  max?: number;
  /**
   * min - the minimum value to slide (0 by default)
   */
  min?: number;
  /**
   * disabled - set the component in disabled mode
   */
  disabled?: boolean;
  /**
   * trackStyle - the style of the track
   */
  trackStyle?: Interpolation;
  /**
   * activePartStyle - the style of the left part of the track
   */
  activePartStyle?: Interpolation;
  /**
   * handleStyle - the style of the slider handle
   */
  handleStyle?: Interpolation;
  /**
   * disabledStyle - the style of the slider in disabled mode
   */
  disabledStyle?: Interpolation;
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
  max = 100,
  min = 0,
  disabled,
  trackStyle,
  activePartStyle,
  handleStyle,
  disabledStyle,
}: NumberSliderProps) {
  return (
    <TypedSlider
      styles={{
        track: desinterpolate(trackStyle),
        active: desinterpolate(activePartStyle),
        thumb: desinterpolate(handleStyle),
        disabled: desinterpolate(disabledStyle),
      }}
      axis="x"
      xmax={max}
      xmin={min}
      xstep={Math.abs(max - min) / 100}
      x={value}
      onChange={({ x }) => onChange && onChange(x)}
      disabled={disabled}
    />
  );
}
