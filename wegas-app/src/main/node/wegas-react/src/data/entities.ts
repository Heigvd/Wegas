import {
  IAbstractEntity,
  ScriptableEntity,
  WegasClassNames,
  WegasClassNamesAndClasses,
} from 'wegas-ts-api';

const InheritanceTable = require('wegas-ts-api/typings/Inheritance.json') as typeof import('wegas-ts-api/typings/Inheritance.json');

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
/**
 * Test if an entity extends a given type
 *
 * @param variable Entity to check
 * @param type Inheritance type
 */
export const entityExtends = <
  Type extends IAbstractEntity,
  SuperType extends IAbstractEntity
>(
  variable: Type,
  type: Mergeable & SuperType['@class'],
): variable is Type & SuperType => inherit(variable['@class'], type);

/**
 * Check if variable has children
 * @param variable Variable to test
 */
export function varIsList<Type>(
  variable: Type,
): variable is Type & IParentDescriptor {
  return (
    typeof variable === 'object' &&
    variable !== null &&
    inherit(
      (variable as Record<string, unknown>)['@class'] as string,
      'DescriptorListI' as Mergeable, // There is an assumption: "DescriptorListI" isn't renamed
    )
  );
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
      'getEntity' in variable
        ? (variable as SVariableDescriptor).getEntity()
        : variable;
    const variableClass = (entity as Record<string, unknown>)[
      '@class'
    ] as Mergeable;
    return (
      variableClass === cls ||
      (variableClass !== undefined &&
        inheritance === true &&
        inherit(variableClass, cls))
    );
  }
  return false;
}

/**
 * Check scriptable entity type (allows to keep the scriptable attribute of the entity while returning).
 * @param variable Variable to test
 * @param cls Discriminant, class
 * @param inheritance Return true if class is inherited from searched class
 */
export function scriptableEntityIs<T extends WegasClassNames>(
  variable: unknown,
  cls: T,
  inheritance?: boolean,
): variable is ScriptableEntity<WegasClassNamesAndClasses[T]> {
  if ('object' === typeof variable && variable != null) {
    if ('getEntity' in variable) {
      const sVariable = variable as SVariableDescriptor;
      if (typeof sVariable.getEntity === 'function') {
        return entityIs(sVariable.getEntity(), cls, inheritance);
      }
    }
  }
  return false;
}

/**
 * Test if a given entity is persisted, ie it has an id
 * @param entity entity to test for
 */
export function entityIsPersisted<T extends IAbstractEntity>(
  entity: T,
): entity is T & { id: number } {
  return typeof entity.id === 'number';
}
