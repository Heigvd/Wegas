interface ModifierKeysEvent {
  ctrlKey?: boolean;
  altKey?: boolean;
}

interface WegasKeyboardEvent extends ModifierKeysEvent {
  keyCode?: number;
}
