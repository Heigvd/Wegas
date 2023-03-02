/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { escapeRegExp } from 'lodash';
import { IAbstractAccount, IAbstractEntity } from 'wegas-ts-api';
import { entityIs } from './API/entityHelper';
import { logger } from './logger';

export const getDisplayName = (account: IAbstractAccount | null | undefined): string => {
  if (account != null) {
    if (entityIs(account, 'GuestJpaAccount')) {
      return 'guest';
    } else {
      return `${account.firstname || ''} ${account.lastname || ''}`.trim() || account.username;
    }
  } else {
    return '';
  }
};

type Map<T> = Record<number, T>;

export const mapByKey = <T>(entities: (T | undefined)[], key: keyof T): Map<T> => {
  const map: Map<T> = {};
  entities.forEach(entity => {
    if (entity != null) {
      const k = entity[key];
      if (k != null && typeof k === 'number') {
        map[k] = entity;
      }
    }
  });
  return map;
};

export const mapById = <T extends IAbstractEntity>(
  entities: (T | undefined)[],
): { [id: number]: T } => {
  return mapByKey(entities, 'id');
};

export const merge = <T extends IAbstractEntity>(
  map: Map<T>,
  entities: (T | undefined)[],
): Map<T> => {
  return {
    ...map,
    ...mapByKey(
      entities.flatMap(entity => (entity != null ? [entity] : [])),
      'id',
    ),
  };
};

/**
 * Merge entities by id within existing map, with version property check
 *
 * @param map original map
 * @param entities entities to merge
 * @returns new up-to-date map
 */
export const mergeVersionised = <T extends IAbstractEntity & { version: number }>(
  map: Map<T>,
  entities: (T | undefined)[],
): Map<T> => {
  return entities.reduce(
    (newMap, entity) => {
      const entityId = entity?.id;
      if (entityId) {
        const existing = newMap[entityId];
        // do not replace entity if previous version has a newer version
        // such cases may occur due to HTTP & websocket asynchrony
        if (existing == null || entity.version >= existing.version) {
          newMap[entityId] = entity;
        }
      }
      return newMap;
    },
    { ...map },
  );
};

//export const mapById = <T extends IAbstractEntity >(entities: T[]): {[id: number]: T} => {
//  const map: {[id: number]: T} = {};
//  entities.forEach(entity => {
//    if (entity.id != null) {
//      map[entity.id] = entity;
//    }
//  });
//  return map;
//};

export const updateById = <T extends IAbstractEntity>(entities: T[], entity: T): void => {
  const index = entities.findIndex(item => entity.id === item.id);
  if (index >= 0) {
    // entity exists in array: replace it
    entities.splice(index, 1, entity);
  } else {
    // entity not found, add it
    entities.push(entity);
  }
};

export const buildLinkWithQueryParam = (
  baseUrl: string,
  queryParameters?: { [key: string]: string | null | undefined },
): string => {
  if (queryParameters == null) {
    return baseUrl;
  } else {
    return (
      baseUrl +
      '?' +
      Object.entries(queryParameters)
        .map(kv =>
          kv[0] && kv[1] ? encodeURIComponent(kv[0]) + '=' + encodeURIComponent(kv[1]) : null,
        )
        .filter(param => !!param)
        .join('&')
    );
  }
};

export const removeAllItems = (array: unknown[], items: unknown[]): void => {
  items.forEach(item => {
    const index = array.indexOf(item);
    if (index >= 0) {
      array.splice(index, 1);
    }
  });
};

export const removeItem = (array: unknown[], item: unknown): void => {
  const index = array.indexOf(item);
  if (index >= 0) {
    array.splice(index, 1);
  }
};

export function checkUnreachable(x: never): void {
  logger.error(x);
}

export function match(search: string, match: (regex: RegExp) => boolean): boolean {
  if (search.length <= 0) {
    return true;
  } else {
    return search.split(/\s+/).reduce<boolean>((acc, current) => {
      if (!acc) {
        return false;
      } else {
        return match(new RegExp(escapeRegExp(current), 'i'));
      }
    }, true);
  }
}

export function optionSelectMatch(option: { label: string }, search: string): boolean {
  return match(search, regex => option.label.match(regex) != null);
}
