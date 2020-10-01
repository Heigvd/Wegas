import * as React from 'react';

/**
 * map identifiers to value.
 * Values are to be injected in the local scriptEval context
 */
export const ScriptCTX = React.createContext<{
  identifiers: { [identifier: string]: object };
}>({ identifiers: {} });
