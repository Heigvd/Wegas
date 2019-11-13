import { useState, useRef, useCallback, useEffect } from 'react';

export function useKeyboard() {
  const initialized = useRef(false);
  const [keyboardEvents, setKeyboardEvents] = useState<WegasKeyboardEvent>({
    keyCode: 0,
    ctrlKey: false,
    altKey: false,
  });
  const keyboardEventHandler = useCallback(
    (e: KeyboardEvent) => {
      setKeyboardEvents({
        keyCode: e.keyCode,
        ctrlKey: e.ctrlKey,
        altKey: e.altKey,
      });
    },
    [setKeyboardEvents],
  );

  useEffect(() => {
    if (!initialized.current) {
      window.addEventListener('keydown', keyboardEventHandler);
      window.addEventListener('keyup', keyboardEventHandler);
      initialized.current = true;
    }
    return () => {
      window.removeEventListener('keydown', keyboardEventHandler);
      window.removeEventListener('keyup', keyboardEventHandler);
      initialized.current = false;
    };
  });
  return keyboardEvents;
}
