import { wwarn } from "./wegaslog";

/** Unmount effect callback */
type UnmoutEffectFn = () => void;

/** Effect callback */
type EffectFn = (() => void | UnmoutEffectFn)

/**
 * list of registerd effects
 */
const effects: EffectFn[] = [];

/**
 * List of unmount-effect callbacks
 */
let unmounters: UnmoutEffectFn[] = [];

/**
 * register effect
 */
export function registerEffect(effect: EffectFn) {
  effects.push(effect);
}

/**
 * run all registered effects
 */
export function runEffects() {
  unmounters = effects.map(fn => {
    try {
      return fn();
    } catch (e) {
      wwarn(e);
    }
  }
  ).flatMap(unmount => unmount ? [unmount] : []);
}

/**
 * Drop all effects
 */
export function clearEffects() {
  unmounters.forEach(fn => fn())
  effects.length = 0;
}
