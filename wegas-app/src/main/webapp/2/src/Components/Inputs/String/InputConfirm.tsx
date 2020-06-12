import * as React from 'react';
import { flex, flexColumn, flexRow, grow } from '../../../css/classes';
import { IconButton } from '../Buttons/IconButton';
import { cx, css } from 'emotion';
import { MessageString } from '../../../Editor/Components/MessageString';
import { SimpleInput } from '../SimpleInput';
import { themeVar } from '../../Style/ThemeVars';
import { useOnClickOutside } from '../../Hooks/useOnClickOutside';

const newModeStyle = css({
  borderColor: themeVar.Common.colors.MainColor,
  borderRadius: themeVar.Common.dimensions.BorderRadius,
  borderWidth: themeVar.Common.dimensions.BorderWidth,
  borderStyle: 'solid',
  padding: themeVar.Common.dimensions.BorderWidth,
});

type InputModes = 'close' | 'new';

interface InputConfirmProps {
  label?: string;
  validator?: (input?: string) => string | undefined;
  forceInputValue?: boolean;
  onChange: (value?: string) => void;
}

export function InputConfirm({
  label,
  validator,
  forceInputValue,
  onChange,
}: InputConfirmProps) {
  const container = React.useRef<HTMLDivElement>(null);

  const [modalState, setModalState] = React.useState<InputModes>('close');
  const [error, setError] = React.useState<string | undefined>();
  const [inputValue, setInputValue] = React.useState<string | undefined>();

  function onCancel() {
    setError(undefined);
    setInputValue(undefined);
    setModalState('close');
  }

  useOnClickOutside(container, onCancel);

  const noInputFound =
    forceInputValue && (inputValue == null || inputValue === '');

  return (
    <div ref={container} className={flex}>
      {modalState === 'close' ? (
        <IconButton
          icon="plus"
          label={label}
          onClick={() => setModalState('new')}
          prefixedLabel
        />
      ) : (
        <div className={cx(flex, flexColumn, newModeStyle)}>
          {error && (
            <MessageString
              type="warning"
              value={error}
              duration={5000}
              onLabelVanish={() => setError(undefined)}
            />
          )}
          <div className={cx(flex, flexRow)}>
            <div className={cx(grow, flex, flexColumn)}>
              <SimpleInput
                placeholder="value name"
                onChange={v => {
                  let error = undefined;
                  if (validator) {
                    error = validator(String(v));
                  }
                  if (!error) {
                    setInputValue(String(v));
                  }
                  setError(error);
                }}
              />
            </div>
            <IconButton
              icon="save"
              disabled={error != null || noInputFound}
              tooltip={noInputFound ? 'You have to enter a value' : undefined}
              onClick={() => {
                onChange(inputValue);
              }}
            />
            <IconButton icon="times" tooltip={'cancel'} onClick={onCancel} />
          </div>
        </div>
      )}
    </div>
  );
}
