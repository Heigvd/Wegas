/**
 * list of registerd effects
 */
const effects: (() => void)[] = [];

/**
 * register effect
 */
export function registerEffect(effect: () => void) {
  effects.push(effect);
}

/**
 * run all registered effects
 */
export function runEffects() {
  effects.forEach(e => e());
}

/**
 * Drop all effects
 */
export function clearEffects() {
  effects.length = 0;
}
