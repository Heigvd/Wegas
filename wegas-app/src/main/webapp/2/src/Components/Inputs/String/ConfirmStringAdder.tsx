import * as React from 'react';
import { SimpleInput } from '../SimpleInput';
import { ConfirmAdder } from './ConfirmAdder';

interface ConfirmStringAdderProps {
  label?: string;
  validator?: (input?: string) => string | undefined;
  forceInputValue?: boolean;
  onAccept: (value?: string) => void;
  placeholder?: string;
}

export function ConfirmStringAdder({
  label,
  validator,
  forceInputValue,
  onAccept,
  placeholder,
}: ConfirmStringAdderProps) {
  return (
    <ConfirmAdder
      label={label}
      validator={validator}
      forceInputValue={forceInputValue}
      onAccept={onAccept}
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
