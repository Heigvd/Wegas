import { inheritanceChain } from '../entities';
import { methods } from './methods';
import { deepClone } from 'fast-json-patch/module/core';
import { IAbstractEntity } from 'wegas-ts-api/typings/WegasEntities';
import { WegasClassNameAndScriptableClasses } from 'wegas-ts-api/typings/WegasScriptableEntities';

const proxyCache = new WeakMap<IAbstractEntity, IAbstractEntity>();

const traps = {
  get: function (
    obj: Record<string | number, unknown>,
    prop: string | number,
  ): unknown {
    const val = obj[prop];
    if (typeof val === 'object' && val !== null) {
      return new Proxy(val, traps);
    }
    return val;
  },
  set: function () {
    return true;
  },
  deleteProperty() {
    return true;
  },
};

export type StronglyTypedEntity<
  T extends {
    '@class': keyof WegasClassNameAndScriptableClasses | string;
  }
> = T['@class'] extends keyof WegasClassNameAndScriptableClasses
  ? WegasClassNameAndScriptableClasses[T['@class']]
  : T;
/**
 * Proxy the AbstractEntity given. Defensively makes it readonly through a proxy.
 * Also adds some methods to it.
 * Meant to be used within client Script
 * @param entity AbstractEntity to proxy
 */
export function proxyfy<
  Entity extends {
    '@class': keyof WegasClassNameAndScriptableClasses | string;
  }
>(entity?: Entity): Readonly<StronglyTypedEntity<Entity>> | undefined {
  if (entity != null) {
    if (proxyCache.has(entity)) {
      return proxyCache.get(entity) as StronglyTypedEntity<Entity>;
    }
    const iChain = [entity['@class'], ...inheritanceChain(entity['@class'])];
    /**
     * IMPORTANT: To avoid proxy unmutability errors with ES6 Proxies use deepClone of object
     */
    const p = new Proxy(deepClone(entity), {
      ...traps,
      get: function (obj, prop: string | number) {
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
