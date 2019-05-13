/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-201
 * 9 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { get } from 'lodash-es';
import { discriminant } from '../normalize';
import {
  Game,
  GameModel,
  Player,
  Team,
  VariableDescriptor,
  VariableInstance,
} from '../selectors';

function findNearestParentInFormVal<T extends IWegasEntity = IWegasEntity>(
  formVal: IWegasEntity,
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

function findNearestParentInStore<T extends IWegasEntity = IWegasEntity>(
  val: IWegasEntity,
  classFilter: string,
): Readonly<T> | undefined {
  let parent: Readonly<T> | undefined;
  if (val.parentType) {
    switch (discriminant({ '@class': val.parentType })) {
      case 'variableDescriptors':
        parent = (VariableDescriptor.select(val.parentId) as unknown) as T;
        break;
      case 'variableInstances':
        parent = (VariableInstance.select(val.parentId) as unknown) as T;
        break;
      case 'gameModels':
        parent = (GameModel.select(val.parentId!) as unknown) as T;
        break;
      case 'games':
        parent = (Game.select(val.parentId!) as unknown) as T;
        break;
      case 'teams':
        parent = (Team.select(val.parentId!) as unknown) as T;
        break;
      case 'players':
        parent = (Player.select(val.parentId!) as unknown) as T;
        break;
    }

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
}

export function findNearestParent<T extends IWegasEntity = IWegasEntity>(
  val: IWegasEntity,
  path: string[],
  classFilter: string,
): Readonly<T> | undefined {
  return (
    findNearestParentInFormVal(val, path, classFilter) ||
    findNearestParentInStore(val, classFilter)
  );
}
