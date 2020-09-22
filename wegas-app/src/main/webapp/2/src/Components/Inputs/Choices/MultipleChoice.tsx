import * as React from 'react';
import { Button } from '../Buttons/Button';
import { debounce, omit } from 'lodash-es';
import { InputProps } from '../SimpleInput';

export interface Choices<T> {
  [label: string]: T;
}

export interface MultipleChoiceProps<T> extends InputProps<Choices<T>> {
  /**
   * choices - all the possible choices
   */
  choices: Choices<T>;
  /**
   * buttonsClassName - the class to apply on the buttons
   */
  buttonsClassName?: string;
}

export function MultipleChoice<T>({
  choices,
  value,
  onChange,
  disabled,
  readOnly,
  buttonsClassName,
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
            mode={selected ? 'active' : undefined}
            disabled={disabled}
            readOnly={readOnly}
            className={buttonsClassName}
          />
        );
      })}
    </div>
  );
}
