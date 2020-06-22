let initialized = false;

export let lastKeyboardEvents: WegasKeyboardEvent;

function keyboardEventHandler(e: KeyboardEvent) {
  lastKeyboardEvents = {
    keyCode: e.keyCode,
    ctrlKey: e.ctrlKey,
    altKey: e.altKey,
  };
}

if (!initialized) {
  initialized = true;
  window.addEventListener('keydown', keyboardEventHandler);
  window.addEventListener('keyup', keyboardEventHandler);
}
