import * as React from 'react';
import { SimpleInput } from '../SimpleInput';
import { ButtonsOrientation, ConfirmAdder } from '../Confirm/ConfirmAdder';

interface ConfirmStringAdderProps {
  label?: string;
  validator?: (input?: string) => string | undefined;
  forceInputValue?: boolean;
  onAccept: (value?: string) => void;
  placeholder?: string;
  orientation?: ButtonsOrientation;
}

export function ConfirmStringAdder({
  label,
  validator,
  forceInputValue,
  onAccept,
  placeholder,
  orientation,
}: ConfirmStringAdderProps) {
  return (
    <ConfirmAdder
      label={label}
      validator={validator}
      accept={value =>
        forceInputValue &&
        (value == null || (typeof value === 'string' && value === ''))
          ? 'You have to enter a value'
          : undefined
      }
      onAccept={onAccept}
      orientation={orientation}
    >
      {onNewValue => (
        <SimpleInput
          placeholder={placeholder}
          onChange={v => onNewValue(() => String(v))}
        />
      )}
    </ConfirmAdder>
  );
}
