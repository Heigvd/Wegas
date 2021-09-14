/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { SVariableDescriptor, WegasClassNames, WegasClassNamesAndClasses } from 'wegas-ts-api';
import InheritanceTable from 'wegas-ts-api/typings/Inheritance.json';
import { WegasErrorMessage } from './restClient';

type Mergeable = keyof typeof InheritanceTable;

function inherit(cls: string, type: Mergeable): boolean {
  if (cls in InheritanceTable) {
    const ext = InheritanceTable[cls as Mergeable];
    if (ext.includes(type)) {
      return true;
    }
    const extCls = ext[0];
    if (typeof extCls === 'string') {
      return inherit(extCls, type);
    }
  }
  return false;
}
export function inheritanceChain(type: string): Mergeable[] {
  if (type in InheritanceTable) {
    const parent = InheritanceTable[type as Mergeable][0] as Mergeable | null;
    if (parent != null) {
      return [parent, ...inheritanceChain(parent)];
    }
  }
  return [];
}

export function entityIsException(entity: unknown): entity is WegasErrorMessage {
  if (typeof entity === 'object' && entity != null) {
    const obj = entity as Record<string, unknown>;
    return obj['@class'] === 'WegasErrorMessage';
  }
  return false;
}

/**
 * Check entity type.
 * @param variable Variable to test
 * @param cls Discriminant, class
 * @param inheritance Return true if class is inherited from searched class
 */
export function entityIs<T extends WegasClassNames>(
  variable: unknown,
  cls: T,
  inheritance?: boolean,
): variable is WegasClassNamesAndClasses[T] {
  if ('object' === typeof variable && variable !== null) {
    const entity =
      'getEntity' in variable ? (variable as SVariableDescriptor).getEntity() : variable;
    const variableClass = (entity as Record<string, unknown>)['@class'] as Mergeable;
    return (
      variableClass === cls ||
      (variableClass !== undefined && inheritance === true && inherit(variableClass, cls))
    );
  }
  return false;
}
