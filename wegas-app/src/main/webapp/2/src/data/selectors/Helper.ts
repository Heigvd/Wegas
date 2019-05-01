/**
 * Wegas
 * http://wegas.albasim.ch
 * 
 * Copyright (c) 2013-201
 * 9 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import {discriminant } from '../normalize';

import {
  VariableDescriptor,
  VariableInstance,
  GameModel,
  Game,
  Team,
  Player,
} from '../selectors';

function findNearestParentInFormVal<T extends IWegasEntity = IWegasEntity>(
  _val: any, 
  formVal: IWegasEntity, 
  path:string[], 
  classFilter: string
): Readonly<T> | undefined {
  const ancestors = path.reduce((acc: any[], path: string, idx: number) =>
        acc[idx] && acc[idx][path] 
        ? acc.concat(acc[idx][path]) 
        : acc, [formVal]);

    return ancestors.find(parent => parent["@class"] === classFilter);
}

function findNearestParentInStore<T extends IWegasEntity = IWegasEntity>(
  val: IWegasEntity, 
  classFilter: string
): Readonly<T> | undefined {
  let parent: Readonly<T> | undefined;
    if (val.parentType){
      switch(discriminant({ "@class": val.parentType, })){
          case "variableDescriptors":
            parent = (VariableDescriptor.select(val.parentId) as any) as T;
            break;
          case 'variableInstances':
            parent = (VariableInstance.select(val.parentId) as any) as T;
            break;
          case 'gameModels':
            parent = (GameModel.select(val.parentId!) as any) as T;
            break;
          case 'games':
            parent = (Game.select(val.parentId!) as any) as T;
            break;
          case 'teams':
            parent = (Team.select(val.parentId!) as any) as T;
            break;
          case 'players':
            parent = (Player.select(val.parentId!) as any) as T;
            break;
      }
      
    if (parent){
      //@TODO: find a clever way
      // hack to match classes like SingleChoiceDescriptor and ChoiceDescriptor equiv.
      if (parent["@class"].endsWith(classFilter)){
        return parent;
      } else {
        return findNearestParentInStore(parent, classFilter)
      }
    }
  }
}

export function findNearestParent<T extends IWegasEntity = IWegasEntity>(
    val: IWegasEntity, 
    path: string[],
    classFilter: string): Readonly<T> | undefined {
    return findNearestParentInFormVal(
      undefined,
      val,
      path,
      classFilter
      ) || findNearestParentInStore(val, classFilter);
}