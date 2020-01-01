import {
  callExpression,
  Expression,
  identifier,
  Identifier,
  memberExpression,
  MemberExpression,
  SpreadElement,
} from '@babel/types';
import { MethodConfig } from '../../../editionConfig';
import { CallExpression } from '@babel/types';
import { isMemberExpression } from '@babel/types';
import { isIdentifier } from '@babel/types';

interface ScriptStore {
  impact: MethodConfig;
  condition: MethodConfig;
}
const SCRIPTS: ScriptStore = {
  impact: {
    'RequestManager.sendCustomEvent': {
      label: 'Send popup',
      parameters: [
        {
          type: 'string' as 'string',
          value: 'popupEvent',
          const: 'popupEvent',
          view: {
            type: 'hidden',
          },
        },
        {
          type: 'object' as 'object',
          properties: {
            content: {
              type: 'string',
              view: {
                type: 'html',
              },
            },
          },
        },
      ],
    },
    'Event.fire': {
      label: 'Fire event',
      parameters: [
        {
          type: 'string' as 'string',
          required: true,
        },
      ],
    },
    'DelayedEvent.delayedFire': {
      label: 'Fire delayed event',
      parameters: [
        {
          type: 'number' as 'number',
          required: true,
          view: { label: 'Minutes' },
        },
        {
          type: 'number' as 'number',
          required: true,
          view: { label: 'Seconds' },
        },
        {
          type: 'string' as 'string',
          required: true,
          view: { label: 'Event name' },
        },
      ],
    },
  },
  condition: {
    'Event.fired': {
      returns: 'boolean',
      label: 'Event has been fired',
      parameters: [
        {
          type: 'string' as 'string',
          required: true,
        },
      ],
    },
  },
};
export function register(type: keyof ScriptStore, methodsObject: MethodConfig) {
  SCRIPTS[type] = {
    ...SCRIPTS[type],
    ...methodsObject,
  };
}
export function getGlobals(type: keyof ScriptStore) {
  return SCRIPTS[type];
}

export function createGlobalCallAST(
  method: string,
  args: (Expression | SpreadElement)[],
) {
  const m = method.split('.').map(i => identifier(i));
  let ret: Identifier | MemberExpression = m.shift()!;
  while (m.length > 0) {
    ret = memberExpression(ret, m.shift());
  }
  return callExpression(ret, args);
}

export function extractGlobalMethod(node: CallExpression) {
  const ret: Identifier[] = [];
  let depth = node.callee;
  while (isMemberExpression(depth)) {
    if (!isIdentifier(depth.property)) {
      throw Error('Unhandled');
    }
    ret.push(depth.property);
    depth = depth.object;
  }
  if (!isIdentifier(depth)) {
    throw Error('Unhandled');
  }
  ret.push(depth);
  return ret
    .reverse()
    .map(i => i.name)
    .join('.');
}
