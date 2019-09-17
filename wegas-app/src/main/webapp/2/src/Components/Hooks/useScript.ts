import { useCallback } from 'react';
import { proxyfy } from '../../data/proxyfy';
import {
  GameModel,
  Player,
  VariableDescriptor as VDSelect,
} from '../../data/selectors';
import { useStore } from '../../data/store';

function find<T extends IVariableDescriptor>(_gm: unknown, name: string) {
  const descriptor = VDSelect.findByName<T>(name);
  return proxyfy(descriptor);
}

const sandbox = document.createElement('iframe');
// This is used to prevent unwanted modification from scripts.
// One can still access main window from the sandbox (window.top) and modify it from there. (Break it)
sandbox.setAttribute('sandbox', 'allow-same-origin');
sandbox.style.display = 'none';
document.body.appendChild(sandbox);
const globals = (sandbox.contentWindow as unknown) as Record<string, unknown>;
globals.Variable = {
  find,
};

/**
 * Hook, execute a script locally.
 * @param script code to execute
 * @returns Last expression or LocalEvalError in case it errors.
 */
export function useScript<ReturnValue>(script: string) {
  const player = useStore(Player.selectCurrent);
  const gameModel = useStore(GameModel.selectCurrent);
  globals.gameModel = proxyfy(gameModel);
  globals.self = proxyfy(player);
  const fn = useCallback(
    () =>
      ((sandbox.contentWindow as unknown) as {
        eval: (code: string) => ReturnValue;
      }).eval('"use strict";undefined;' + script), // 'undefined' so that an empty script don't return '"use strict"'
    [script],
  );
  return useStore(fn);
}
