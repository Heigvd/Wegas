/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
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
    // entity exists in array:replace it
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
