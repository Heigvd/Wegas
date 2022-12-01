import { wwarn } from './wegaslog';

/** Unmount effect callback */
type UnmoutEffectFn = () => void;

/** Effect callback */
type EffectFn = () => void | UnmoutEffectFn;

/**
 * list of registerd effects
 */
const effects: EffectFn[] = [];

/**
 * List of unmount-effect callbacks
 */
let unmounters: UnmoutEffectFn[] = [];

const refs: Record<string, { current: unknown }> = {};

/**
 * Create and init a PageContext state.
 * @param id the ref will be saved with this id
 * @param value: initial state value
 *
 * @returns an object with a "current" prop that can be sat and will keep its value even when scripts are reloaded
 */
export const useRef: GlobalHelpersClass['useRef'] = <T>(
  id: string,
  value: T,
) => {
  if (!(id in refs)) {
    refs[id] = { current: value };
  }
  return refs[id] as { current: T };
};

export function clearAllRefs() {
  for (const key in refs){
    delete refs[key];
  }
}


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
  unmounters = effects
    .map(fn => {
      try {
        return fn();
      } catch (e) {
        wwarn(e);
      }
    })
    .flatMap(unmount => (unmount ? [unmount] : []));
}

/**
 * Unmount all effects and refs
 */
export function unmountEffects() {
  unmounters.forEach(fn => fn());
  clearAllRefs();
}

/**
 * Unmount all effects and clear list
 */
export function clearEffects() {
  unmountEffects();
  effects.length = 0;
}
