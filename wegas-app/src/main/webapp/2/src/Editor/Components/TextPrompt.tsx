import * as React from 'react';
import { IconButton } from '../../Components/Button/IconButton';
import { useOnClickOutside } from '../../Components/Hooks/useOnClickOutside';

interface TextPromptProps {
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
}: TextPromptProps) {
  const inputValue = React.useRef('');
  const input = React.useRef<HTMLInputElement>(null);
  const textPrompt = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (defaultFocus && input.current) {
      input.current.focus();
    }
  }, [defaultFocus]);

  useOnClickOutside(textPrompt, () => onBlur && onBlur());

  return (
    <div ref={textPrompt}>
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
      <IconButton
        icon={'thumbs-up'}
        label={'Accept'}
        onClick={event => {
          event.stopPropagation();
          onAction(true, inputValue.current);
        }}
      />
      <IconButton
        icon={'times'}
        label={'Cancel'}
        onClick={event => {
          event.stopPropagation();
          onAction(false, inputValue.current);
        }}
      />
    </div>
  );
}
