/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-201
 * 9 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { get, isMatch } from 'lodash-es';
import { discriminant } from '../normalize';
import { Game, GameModel, Player, Team, VariableDescriptor, VariableInstance } from '../selectors';
import { IAbstractEntity } from 'wegas-ts-api';

function findNearestParentInFormVal<T extends IAbstractEntity = IAbstractEntity>(
  formVal: IAbstractEntity,
  path: string[],
  classFilter: string,
): Readonly<T> | undefined {
  let parent = path;
  while (parent.length) {
    parent = parent.slice(0, -1);
    let p;
    if (parent.length === 0) {
      p = formVal;
    } else {
      p = get(formVal, parent);
    }
    if (typeof p === 'object' && p != null && p['@class'] === classFilter) {
      return p;
    }
  }
}

function findNearestParentInStore<T extends IAbstractEntity = IAbstractEntity>(
  val: IAbstractEntity,
  classFilter: string,
): Readonly<T> | undefined {
  let parent = getParent<T>(val);
  if (parent) {
    //@TODO: find a clever way
    // hack to match classes like SingleChoiceDescriptor and ChoiceDescriptor equiv.
    if (parent['@class'].endsWith(classFilter)) {
      return parent;
    } else {
      return findNearestParentInStore(parent, classFilter);
    }
  }
}

/**
 * get entity parent based on entity parentType and parentId
 */
export function getParent<T extends IAbstractEntity = IAbstractEntity>(val: IAbstractEntity): Readonly<T> | undefined {
  if (val.parentType) {
    switch (discriminant({ '@class': val.parentType })) {
      case 'variableDescriptors':
        return (VariableDescriptor.select(val.parentId) as unknown) as T;
      case 'variableInstances':
        return (VariableInstance.select(val.parentId) as unknown) as T;
      case 'gameModels':
        return (GameModel.select(val.parentId!) as unknown) as T;
      case 'games':
        return (Game.select(val.parentId!) as unknown) as T;
      case 'teams':
        return (Team.select(val.parentId!) as unknown) as T;
      case 'players':
        return (Player.select(val.parentId!) as unknown) as T;
    }
    return undefined;
  }
}

export function findFirstParentMatch<T extends IAbstractEntity = IAbstractEntity>(
  entity: IAbstractEntity,
  o: Partial<T>,
): Readonly<T> | undefined {
  let p = getParent(entity);
  while (p) {
    if (isMatch(p, o)) {
      return p as T;
    }
    p = getParent(p);
  }
}

export function findNearestParent<T extends IAbstractEntity = IAbstractEntity>(
  val: IAbstractEntity,
  path: string[],
  classFilter: string,
): Readonly<T> | undefined {
  return findNearestParentInFormVal(val, path, classFilter) || findNearestParentInStore(val, classFilter);
}
