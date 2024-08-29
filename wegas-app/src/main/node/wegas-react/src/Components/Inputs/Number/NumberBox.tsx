import * as React from 'react';
import { debounce } from 'lodash-es';
import { cx, css } from '@emotion/css';
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
import { classNameOrEmpty, classOrNothing } from '../../../Helper/className';
import { themeVar } from '../../Theme/ThemeVars';
import { MessageString } from '../../../Editor/Components/MessageString';

const numberBoxStyle = css({
  padding: '10px',
});

const numberBoxSquareStyle = css({
  borderStyle: 'solid',
  borderRadius: '2px',
  width: '1.5em',
  height: '1.5em',
  lineHeight: '1.25em',
  fontSize: '1em',
  textAlign: 'center',
  cursor: 'default',
  ['&.disabled']: {
    opacity: '0.5',
  },
  [':not(.disabled)']: {
    borderColor: themeVar.colors.PrimaryColor,
    color: themeVar.colors.DarkTextColor,
    ['&.active']: {
      backgroundColor: themeVar.colors.PrimaryColor,
      color: themeVar.colors.LightTextColor,
    },

    ['&.clickable']: {
      cursor: 'pointer',
      ['&:not(.disabled):hover']: {
        borderColor: themeVar.colors.PrimaryColor,
      },
    },
  },
});

interface NumberSquareProps extends ClassStyleId {
  value?: number | string;
  onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  active?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  numberedBox?: boolean;
}

function NumberSquare({
  value,
  onClick,
  active,
  disabled,
  readOnly,
  numberedBox,
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
        classOrNothing('disabled', disabled) +
        classOrNothing('clickable', !disabled && !readOnly && onClick != null) +
        classNameOrEmpty(className)
      }
      style={style}
    >
      {numberedBox ? value : null}
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
  numberedBoxes?: boolean;
  /**
   * boxClassName - the class to apply on the boxes
   */
  boxClassName?: string;
}

export function NumberBox({
  value = 0,
  minValue,
  maxValue,
  onChange,
  disabled,
  readOnly,
  numberedBoxes,
  boxClassName,
  className,
  id,
}: NumberBoxProps) {
  const [currentValue, setCurrentValue] = React.useState(value);

  const readonly = readOnly || !onChange;

  React.useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const debouncedOnChange = React.useCallback(
    debounce((value: number) => {
      onChange && onChange(value);
    }, 100),
    [onChange],
  );

  const squares: JSX.Element[] = [];

  if (minValue !== undefined && maxValue !== undefined) {

    // We do not want to display more than 100 boxes
    if (maxValue - minValue > 100) {
      return (
        <MessageString
          value={`Component cannot display values bigger than 100`}
          type={'error'}
        />
      );
    }

    // Do not display a box for when value is 0
    for (let i = minValue === 0 ? 1 : minValue; i <= currentValue + (readonly ? 0 : 1); ++i) {
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
          numberedBox={numberedBoxes}
          className={boxClassName}
        />,
      );
    }
  }

  return (
    <div
      id={id}
      className={
        cx(flex, flexColumn, expandWidth, itemCenter) +
        classNameOrEmpty(className)
      }
    >
      <CheckMinMax min={minValue} max={maxValue} value={currentValue} />
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
