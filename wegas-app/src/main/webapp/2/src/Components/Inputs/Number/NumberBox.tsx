import * as React from 'react';
import { debounce } from 'lodash-es';
import { cx, css } from 'emotion';
import {
  flex,
  flexColumn,
  expandWidth,
  itemCenter,
  flexRow,
  flexWrap,
  justifyCenter,
} from '../../../css/classes';
import { CheckMinMax } from './numberComponentHelper';
import { InputProps } from '../SimpleInput';
import { Value } from '../../Outputs/Value';
import { classNameOrEmpty, classOrNothing } from '../../../Helper/className';
import { themeVar } from '../../Style/ThemeVars';

const numberBoxStyle = css({
  padding: '10px',
});

const numberBoxSquareStyle = css({
  borderColor: themeVar.Common.colors.PrimaryColor,
  color: themeVar.Common.colors.DarkTextColor,
  borderStyle: 'solid',
  borderRadius: '2px',
  width: '1.5em',
  height: '1.5em',
  lineHeight: '1.25em',
  fontSize: '1em',
  textAlign: 'center',
  cursor: 'default',

  ['&.active']: {
    backgroundColor: themeVar.Common.colors.PrimaryColor,
    color: themeVar.Common.colors.LightTextColor,
  },

  ['&.clickable']: {
    cursor: 'pointer',
    ['&:not(.disabled):hover']: {
      borderColor: themeVar.Common.colors.PrimaryColor,
    },
  },
});

interface NumberSquareProps extends ClassStyleId {
  value?: number | string;
  onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  active?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  hideValue?: boolean;
}

function NumberSquare({
  value,
  onClick,
  active,
  disabled,
  readOnly,
  hideValue,
  className,
  style,
}: NumberSquareProps) {
  return (
    <div
      onClick={e => !disabled && !readOnly && onClick && onClick(e)}
      className={
        'wegas-numberBox-sqare ' +
        numberBoxSquareStyle +
        ' ' +
        classOrNothing('active', active) +
        classOrNothing('disabled', !active && disabled) +
        classOrNothing('clickable', !disabled && !readOnly) +
        classNameOrEmpty(className)
      }
      style={style}
    >
      {hideValue ? null : value}
    </div>
  );
}

export interface NumberBoxProps extends InputProps<number> {
  /**
   * minValue - the minimal value
   */
  minValue?: number;
  /**
   * maxValue - the maximal value
   */
  maxValue?: number;
  /**
   * hideBoxValue - hide the value in the box
   */
  hideBoxValue?: boolean;
  /**
   * showLabelValue - show the value of the number in the label
   */
  showLabelValue?: boolean;
  /**
   * showQuantity - the boxes start from 1 event with min value lower or higher
   */
  showQuantity?: boolean;
  /**
   * boxClassName - the class to apply on the boxes
   */
  boxClassName?: string;
}

export function NumberBox({
  value,
  minValue,
  maxValue,
  onChange,
  label,
  disabled,
  readOnly,
  hideBoxValue,
  showLabelValue,
  showQuantity,
  boxClassName,
  className,
  id,
}: NumberBoxProps) {
  const [currentValue, setCurrentValue] = React.useState(value || 0);

  const computedMinValue = showQuantity
    ? 1
    : minValue !== undefined
    ? minValue
    : 0;
  const computedMaxValue = maxValue !== undefined ? maxValue : currentValue + 1;
  const readonly = readOnly || !onChange;

  React.useEffect(() => {
    setCurrentValue(value || 0);
  }, [value]);

  const debouncedOnChange = React.useCallback(
    debounce((value: number) => {
      onChange && onChange(value);
    }, 100),
    [onChange],
  );

  const squares: JSX.Element[] = [];

  for (
    let i = computedMinValue;
    i < computedMaxValue + (readonly ? 0 : 1);
    ++i
  ) {
    squares.push(
      <NumberSquare
        key={i}
        value={i}
        onClick={() => {
          setCurrentValue(i);
          debouncedOnChange(i);
        }}
        active={i <= currentValue}
        disabled={disabled}
        readOnly={readonly}
        hideValue={hideBoxValue}
        // activeClassName={activeClassName}
        className={boxClassName}
      />,
    );
  }

  return (
    <div
      id={id}
      className={
        cx(flex, flexColumn, expandWidth, itemCenter) +
        classNameOrEmpty(className)
      }
    >
      {label && (
        <Value value={label + (showLabelValue ? ` : ${currentValue}` : '')} />
      )}
      <CheckMinMax
        min={computedMinValue}
        max={computedMaxValue}
        value={currentValue}
      />
      <div
        className={
          'wegas wegas-numberBox ' +
          cx(flex, flexRow, flexWrap, justifyCenter, numberBoxStyle)
        }
      >
        {squares}
      </div>
    </div>
  );
}
