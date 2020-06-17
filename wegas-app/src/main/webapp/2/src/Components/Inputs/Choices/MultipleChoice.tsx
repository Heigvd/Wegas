import * as React from 'react';
import { Button } from '../Buttons/Button';
import { debounce, omit } from 'lodash-es';
import { cx, css } from 'emotion';
import { InputProps } from '../SimpleInput';
import { themeVar } from '../../Style/ThemeVars';

const choiceStyle = css({
  backgroundColor: themeVar.Common.colors.MainColor,
  margin: '2px',
  ':hover': {
    backgroundColor: themeVar.Common.colors.MainColor,
  },
});

const usableChoiceStyle = css({
  cursor: 'pointer',
});

const unusableChoiceStyle = css({
  cursor: 'default',
});

const selectedChoiceStyle = css({
  backgroundColor: themeVar.Common.colors.ActiveColor,
  ':hover': {
    backgroundColor: themeVar.Common.colors.HoverColor,
  },
});
const disabledChoiceStyle = css({
  backgroundColor: themeVar.Common.colors.DisabledColor,
  // ':hover': {
  //   backgroundColor: themeVar.Common.colors.DisabledChoiceHoverColor,
  // },
});

export interface Choices<T> {
  [label: string]: T;
}

export interface MultipleChoiceProps<T> extends InputProps<Choices<T>> {
  /**
   * choices - all the possible choices
   */
  choices: Choices<T>;
  /**
   * selectedClassName - the class to apply on an active choice
   */
  selectedClassName?: string;
  /**
   * disabledClassName - the class to apply on a disabled choice
   */
  disabledClassName?: string;
}

export function MultipleChoice<T>({
  choices,
  value,
  onChange,
  disabled,
  readOnly,
  selectedClassName,
  disabledClassName,
  className,
  style,
  id,
}: MultipleChoiceProps<T>) {
  const [currentChosen, setCurrentChosen] = React.useState<Choices<T>>(
    value ? value : {},
  );

  React.useEffect(() => {
    setCurrentChosen(value ? value : {});
  }, [value]);

  const debouncedOnChange = React.useCallback(
    debounce((newChosen: Choices<T>) => {
      onChange && onChange(newChosen);
    }, 100),
    [onChange],
  );

  return (
    <div id={id} className={className}>
      {Object.entries(choices).map(([key, choice]) => {
        const selected = Object.keys(currentChosen).includes(key);
        return (
          <Button
            key={key}
            label={key}
            style={style}
            onClick={() => {
              if (!readOnly && !disabled) {
                let newSet = currentChosen;
                if (selected) {
                  newSet = omit(newSet, key);
                } else {
                  newSet = { ...newSet, [key]: choice };
                }
                setCurrentChosen(newSet);
                debouncedOnChange(newSet);
              }
            }}
            className={cx(className ? className : choiceStyle, {
              [selectedClassName
                ? selectedClassName
                : selectedChoiceStyle]: selected,
              [disabledClassName ? disabledClassName : disabledChoiceStyle]:
                disabled && !selected,
              [unusableChoiceStyle]: disabled || readOnly,
              [usableChoiceStyle]: disabled && readOnly,
            })}
            disabled={disabled}
          />
        );
      })}
    </div>
  );
}
