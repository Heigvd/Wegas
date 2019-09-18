import { inheritanceChain } from '../entities';
import * as ListDescriptor from './ListDescriptor';
import * as NumberDescriptor from './NumberDescriptor';
import * as VariableDescriptor from './VariableDescriptor';

export const methods: {
  [cls: string]: {
    [prop: string]: (entity: IAbstractEntity) => unknown;
  };
} = {
  VariableDescriptor,
  NumberDescriptor,
  ListDescriptor,
};
const traps = {
  get: function(
    obj: Record<string | number, unknown>,
    prop: string | number,
  ): unknown {
    const val = obj[prop];
    if (typeof val === 'object' && val !== null) {
      return new Proxy(val, traps);
    }
    return val;
  },
  set: function() {
    return true;
  },
  deleteProperty() {
    return true;
  },
};
// function immutable(o: object) {
//   return new Proxy(o, traps);
// }
const proxyCache = new WeakMap<IAbstractEntity, IAbstractEntity>();
/**
 * Proxy the AbstractEntity given. Defensively makes it readonly through a proxy.
 * Also adds some methods to it.
 * Meant to be used within client Script
 * @param entity AbstractEntity to proxy
 */
export function proxyfy<Entity extends IAbstractEntity>(
  entity?: Entity,
): Readonly<Entity> | undefined {
  if (entity != null) {
    if (proxyCache.has(entity)) {
      return proxyCache.get(entity) as Entity;
    }
    const iChain = [entity['@class'], ...inheritanceChain(entity['@class'])];
    const p = new Proxy(entity, {
      ...traps,
      get: function(obj, prop: string | number) {
        for (const cls of iChain) {
          if (cls in methods && typeof methods[cls][prop] === 'function') {
            return methods[cls][prop](entity);
          }
        }
        return traps.get(
          (obj as unknown) as Record<string | number, unknown>,
          prop,
        );
      },
    });
    proxyCache.set(entity, p);
    return p;
  }
  return entity;
}
