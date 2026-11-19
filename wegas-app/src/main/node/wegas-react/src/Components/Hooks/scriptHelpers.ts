/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

/**
 * Decision helpers of useScript. They do not depend on the rest of the app, so
 * they can be unit-tested on their own (useScript itself cannot be loaded by jest).
 */
import { shallowEqual } from 'react-redux';
import type { IScript } from 'wegas-ts-api';

/** A script item with nothing to evaluate: no script, or an empty one. */
export const isEmptyScriptItem = (
  item: string | IScript | undefined | null,
): boolean => !item || (typeof item !== 'string' && !item.content);

/** What the sandbox globals are built from. */
export interface GlobalsInputs {
  globalContexts: object;
  dataVersion: unknown;
}

/**
 * True when the globals written for `next` are the ones already written for
 * `previous`. Contexts are compared by value: each useGlobalContexts() call
 * returns its own object.
 */
export function sameGlobalsInputs(
  previous: GlobalsInputs | undefined,
  next: GlobalsInputs,
): boolean {
  return (
    previous !== undefined &&
    previous.dataVersion === next.dataVersion &&
    shallowEqual(previous.globalContexts, next.globalContexts)
  );
}
