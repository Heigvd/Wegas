import * as React from 'react';
import { Button } from '../Buttons/Button';
import { debounce, omit } from 'lodash-es';
import { themeVar } from '../../Theme';
import { cx, css } from 'emotion';
import { InputProps } from '../SimpleInput';

const choiceStyle = css({
  backgroundColor: themeVar.primaryLighterColor,
  margin: '2px',
  cursor: 'pointer',
  ':hover': {
    backgroundColor: themeVar.primaryDarkerColor,
  },
});
const selectedChoiceStyle = css({
  backgroundColor: themeVar.primaryDarkerColor,
  ':hover': {
    backgroundColor: themeVar.primaryDarkerColor,
  },
});
const disabledChoiceStyle = css({
  backgroundColor: themeVar.disabledColor,
  ':hover': {
    backgroundColor: themeVar.disabledColor,
  },
});
const unusableChoiceStyle = css({
  cursor: 'default',
});

interface Choices<T> {
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
   * choiceClassName - the class to apply on the choices
   */
  choiceClassName?: string;
}

export function MultipleChoice<T>({
  choices,
  value,
  onChange,
  disabled,
  readOnly,
  selectedClassName,
  choiceClassName,
  className,
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
            className={cx(choiceStyle, {
              [selectedClassName
                ? selectedClassName
                : selectedChoiceStyle]: selected,
              [disabledChoiceStyle]: disabled && !selected,
              [choiceClassName
                ? choiceClassName
                : themeVar.primaryLighterColor]: !disabled && !selected,
              [unusableChoiceStyle]: disabled || readOnly,
            })}
            disabled={disabled}
          />
        );
      })}
    </div>
  );
}
