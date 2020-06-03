import * as React from 'react';
import { debounce } from 'lodash-es';
import { themeVar } from '../../Style/Theme';
import { cx, css } from 'emotion';
import {
  flex,
  flexColumn,
  flexRow,
  expandWidth,
  flexWrap,
  itemCenter,
  justifyCenter,
} from '../../../css/classes';
import { CheckMinMax } from './numberComponentHelper';
import { InputProps } from '../SimpleInput';
import { Value } from '../../Outputs/Value';
import { classNameOrEmpty } from '../../../Helper/className';

const numberSquareStyle = css({
  borderColor: themeVar.disabledColor,
  borderStyle: 'solid',
  borderRadius: '2px',
  width: '2em',
  height: '2em',
  lineHeight: '2em',
  textAlign: 'center',
  cursor: 'default',
});

const activeNumberSquareStyle = css({
  backgroundColor: themeVar.primaryLighterColor,
});

const clickableNumberSquareStyle = css({
  cursor: 'pointer',
  ':hover': {
    borderColor: themeVar.primaryTextColor,
  },
});

const disabledNumberSquareStyle = css({
  backgroundColor: themeVar.disabledColor,
});

const squareFrameStyle = css({
  padding: '10px',
});

interface NumberSquareProps extends ClassAndStyle {
  value?: number | string;
  onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  active?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  hideValue?: boolean;
  activeClassName?: string;
}

function NumberSquare({
  value,
  onClick,
  active,
  disabled,
  readOnly,
  hideValue,
  activeClassName,
  className,
  style,
}: NumberSquareProps) {
  return (
    <div
      onClick={e => !disabled && !readOnly && onClick && onClick(e)}
      className={
        cx(numberSquareStyle, {
          [activeClassName ? activeClassName : activeNumberSquareStyle]: active,
          [clickableNumberSquareStyle]: !disabled && !readOnly,
          [disabledNumberSquareStyle]: disabled && active,
        }) + classNameOrEmpty(className)
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
   * activeClassName - the class to apply on an active box
   */
  activeClassName?: string;
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
  activeClassName,
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
        activeClassName={activeClassName}
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
        className={cx(flex, flexRow, flexWrap, justifyCenter, squareFrameStyle)}
      >
        {squares}
      </div>
    </div>
  );
}
