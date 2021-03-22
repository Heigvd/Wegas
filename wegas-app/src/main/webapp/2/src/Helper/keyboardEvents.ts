let initialized = false;

export const lastKeyboardEvents: WegasKeyboardEvent = {
  keyCode: undefined,
  ctrlKey: undefined,
  altKey: undefined,
};

function keyboardEventHandler(e: KeyboardEvent) {
  lastKeyboardEvents.keyCode = e.keyCode;
  lastKeyboardEvents.ctrlKey = e.ctrlKey;
  lastKeyboardEvents.altKey = e.altKey;
}

if (!initialized) {
  initialized = true;
  window.addEventListener('keydown', keyboardEventHandler);
  window.addEventListener('keyup', keyboardEventHandler);
}
