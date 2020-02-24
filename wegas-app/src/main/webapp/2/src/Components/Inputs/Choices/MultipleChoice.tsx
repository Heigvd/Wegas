import * as React from 'react';
import { Button } from '../Buttons/Button';
import { debounce, omit } from 'lodash-es';
import { themeVar } from '../../Theme';
import { cx, css } from 'emotion';

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

export interface MultipleChoiceProps<T> {
  /**
   * choices - all the possible choices
   */
  choices: Choices<T>;
  /**
   * chosen - the chosen choices
   */
  chosen?: Choices<T>;
  /**
   * onChange - return the choices chosen in the component
   */
  onChange?: (chosen: Choices<T>) => void;
  /**
   * disabled - disable the component
   */
  disabled?: boolean;
  /**
   * readOnly - disable the click on the component
   */
  readOnly?: boolean;
  /**
   * selectedClassName - the class to apply on an active choice
   */
  selectedClassName?: string;
  /**
   * choiceClassName - the class to apply on the choices
   */
  choiceClassName?: string;
  /**
   * className - the class to apply on the component
   */
  className?: string;
}

export function MultipleChoice<T>({
  choices,
  chosen,
  onChange,
  disabled,
  readOnly,
  selectedClassName,
  choiceClassName,
  className,
}: MultipleChoiceProps<T>) {
  const [currentChosen, setCurrentChosen] = React.useState(
    chosen ? chosen : {},
  );

  React.useEffect(() => {
    setCurrentChosen(chosen ? chosen : {});
  }, [chosen]);

  const debouncedOnChange = React.useCallback(
    debounce((newChosen: Choices<T>) => {
      onChange && onChange(newChosen);
    }, 100),
    [onChange],
  );

  return (
    <div>
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
            className={cx(
              choiceStyle,
              {
                [selectedClassName
                  ? selectedClassName
                  : selectedChoiceStyle]: selected,
                [disabledChoiceStyle]: disabled && !selected,
                [choiceClassName
                  ? choiceClassName
                  : themeVar.primaryLighterColor]: !disabled && !selected,
                [unusableChoiceStyle]: disabled || readOnly,
              },
              className,
            )}
            disabled={disabled}
          />
        );
      })}
    </div>
  );
}
