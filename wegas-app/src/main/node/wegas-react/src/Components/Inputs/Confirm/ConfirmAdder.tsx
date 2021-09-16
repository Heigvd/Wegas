import * as React from 'react';
import {
  flex,
  flexColumn,
  flexRow,
  justifyCenter,
  itemCenter,
  layoutStyle,
} from '../../../css/classes';
import { cx, css } from '@emotion/css';
// import { MessageString } from '../../../Editor/Components/MessageString';
import { themeVar } from '../../Theme/ThemeVars';
import { useOnClickOutside } from '../../Hooks/useOnClickOutside';
import { Button } from '../Buttons/Button';
import { ConfirmInput } from './ConfirmInput';

const newModeStyle = css({
  borderColor: themeVar.colors.PrimaryColor,
  borderRadius: themeVar.dimensions.BorderRadius,
  borderWidth: themeVar.dimensions.BorderWidth,
  borderStyle: 'solid',
  padding: themeVar.dimensions.BorderWidth,
});

type InputModes = 'close' | 'new';
export type ButtonsOrientation = 'vertical' | 'horizontal';

export interface ConfrimAdderProps<T> {
  label?: string;
  validator?: (input?: T) => string | undefined;
  accept?: (input?: T) => string | undefined;
  onAccept: (value?: T) => void;
  children: (
    onNewValue: (setter: (oldValue?: T) => T | undefined) => void,
  ) => JSX.Element;
  orientation?: ButtonsOrientation;
}

export function ConfirmAdder<T>({
  label,
  validator,
  accept,
  onAccept,
  children,
  orientation = 'vertical',
}: ConfrimAdderProps<T>) {
  const container = React.useRef<HTMLDivElement>(null);

  const [modalState, setModalState] = React.useState<InputModes>('close');
  const [error, setError] = React.useState<string | undefined>();
  const [inputValue, setInputValue] = React.useState<T | undefined>();

  const setValue = React.useCallback<
    (setter: (oldValue?: T) => T | undefined) => void
  >(
    setter => {
      const newValue = setter(inputValue);

      let error = undefined;
      if (validator) {
        error = validator(newValue);
      }
      setError(error);
      setInputValue(newValue);
    },
    [inputValue, validator],
  );

  function onCancel() {
    setError(undefined);
    setInputValue(undefined);
    setModalState('close');
  }

  useOnClickOutside(container, onCancel);

  return (
    <div ref={container} className={flex}>
      {modalState === 'close' ? (
        <Button
          icon="plus"
          label={label}
          onClick={() => setModalState('new')}
          prefixedLabel
        />
      ) : (
        <div
          className={cx(
            flex,
            orientation === 'vertical' ? flexColumn : flexRow,
            newModeStyle,
            justifyCenter,
            itemCenter,
            layoutStyle,
          )}
        >
          <ConfirmInput
            onAccept={() => {
              onAccept(inputValue);
              setInputValue(undefined);
              setModalState('close');
            }}
            onCancel={onCancel}
            disabled={error != null || !accept || accept(inputValue) != null}
            tooltip={(accept && accept(inputValue)) || error}
          >
            {children(setValue)}
          </ConfirmInput>
        </div>
      )}
    </div>
  );
}
