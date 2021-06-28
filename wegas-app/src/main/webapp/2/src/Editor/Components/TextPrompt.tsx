import * as React from 'react';
import { useOnClickOutside } from '../../Components/Hooks/useOnClickOutside';
import { cx } from 'emotion';
import { flex, flexRow } from '../../css/classes';
import { IconButton } from '../../Components/Inputs/Buttons/IconButton';
import { languagesCTX } from '../../Components/Contexts/LanguagesProvider';
import { internalTranslate } from '../../i18n/internalTranslator';
import { commonTranslations } from '../../i18n/common/common';

interface TextPromptProps extends ClassStyleId {
  /**
   * label - The label to display net to the input
   */
  label?: string | React.Component;
  /**
   * placeholder - The example text to put in the input
   */
  placeholder?: string;
  /**
   * onAction - Called when a button is pressed (Accept or Cancel) and gets the input value
   */
  onAction: (success: boolean, text: string) => void;
  /**
   * onBlur - Called when a click is done outside of the TextPrompt element
   */
  onBlur?: () => void;
  /**
   * applyOnEnter - Auto click on accept when the enter key is pressed
   */
  applyOnEnter?: boolean;
  /**
   * defaultFocus - force editor to focus on first render
   */
  defaultFocus?: boolean;
}

export function TextPrompt({
  label,
  placeholder,
  onAction,
  onBlur,
  applyOnEnter,
  defaultFocus,
  className,
  style,
}: TextPromptProps) {
  const inputValue = React.useRef('');
  const input = React.useRef<HTMLInputElement>(null);
  const textPrompt = React.useRef<HTMLDivElement>(null);
  const { lang } = React.useContext(languagesCTX);
  const i18nValues = internalTranslate(commonTranslations, lang);

  React.useEffect(() => {
    if (defaultFocus && input.current) {
      input.current.focus();
    }
  }, [defaultFocus]);

  useOnClickOutside(textPrompt, () => {
    onBlur && onBlur();
  });

  return (
    <div
      ref={textPrompt}
      className={cx(flex, flexRow, className)}
      style={style}
    >
      {label}
      <input
        ref={input}
        placeholder={placeholder}
        type="text"
        onClick={event => event.stopPropagation()}
        onChange={({ target }) => (inputValue.current = target.value)}
        onKeyDown={event => {
          if (applyOnEnter && (event.which || event.keyCode) === 13) {
            onAction(true, inputValue.current);
          }
        }}
      />
      <div className={cx(flex, flexRow)}>
      <IconButton
          icon={'times'}
          tooltip={i18nValues.cancel}
          onClick={event => {
            event.stopPropagation();
            onAction(false, inputValue.current);
          }}
        />
        <IconButton
          icon={'check'}
          tooltip={i18nValues.accept}
          onClick={event => {
            event.stopPropagation();
            onAction(true, inputValue.current);
          }}
        />
      </div>
    </div>
  );
}
