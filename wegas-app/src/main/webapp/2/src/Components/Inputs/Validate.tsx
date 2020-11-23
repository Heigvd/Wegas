import { cx } from 'emotion';
import * as React from 'react';
import { flex, flexColumn, flexRow, grow } from '../../css/classes';
import { Button } from './Buttons/Button';

interface ValidateProps<T> {
  value: T;
  onChange: (value: T) => void;
  children: (value: T, onChange: (value: T) => void) => JSX.Element;
}

export function Validate<T>({ value, onChange, children }: ValidateProps<T>) {
  const [childrenFocused, setChildrenFocused] = React.useState<boolean>(false);
  const [savedValue, setSavedValue] = React.useState<T>(value);

  React.useEffect(() => {
    setSavedValue(value);
  }, [value]);

  return (
    <div className={cx(flex, flexRow)}>
      <div className={grow} onClick={() => setChildrenFocused(true)}>
        {children(savedValue, setSavedValue)}
      </div>
      {childrenFocused && (
        <div className={cx(flex, flexColumn)}>
          <Button icon="times" onClick={() => setChildrenFocused(false)} />
          <Button
            icon="check"
            onClick={() => {
              setChildrenFocused(false);
              onChange(savedValue);
            }}
          />
        </div>
      )}
    </div>
  );
}
