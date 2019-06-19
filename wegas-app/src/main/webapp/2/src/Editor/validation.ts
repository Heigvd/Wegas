import { findNearestParent } from "../data/selectors/Helper";

type validator<Args extends unknown[]> = (...args: Args) => boolean;
type Leaf<Args extends unknown[], Ref> = (
  ref: Ref,
) => (...args: Args) => unknown;
/**
 * General purpose schema validator.
 * Curried validation.
 *
 * Refs -> Schema -> Values
 * @param leafValidation
 */
export function validation<Args extends unknown[], Ref>(
  leafValidation: Leaf<Args, Ref>,
) {
  type validationSchema =
    | AND
    | NOT
    | OR
    | EQUALS
    | NOTEQUALS
    | ISDEFINED
    | ISTRUE
    | ISFALSE
    | LESSTHAN
    | LESSTHANOREQUALS
    | GREATERTHAN
    | GREATERTHANOREQUALS;

  interface AND {
    and: validationSchema[];
  }
  function isAnd(value: validationSchema): value is AND {
    return 'and' in value;
  }
  function and(value: AND): validator<Args> {
    return (...args) => !value.and.some(schema => !evaluate(schema)(...args));
  }
  interface OR {
    or: validationSchema[];
  }
  function isOr(value: validationSchema): value is OR {
    return 'or' in value;
  }
  function or(value: OR): validator<Args> {
    return (...args) => value.or.some(schema => evaluate(schema)(...args));
  }
  interface NOT {
    not: validationSchema;
  }
  function isNot(value: validationSchema): value is NOT {
    return 'not' in value;
  }
  function not(value: NOT): validator<Args> {
    return (...args) => !evaluate(value.not)(...args);
  }
  interface EQUALS {
    eq: [Ref, Ref];
  }
  function isEquals(value: validationSchema): value is EQUALS {
    return 'eq' in value;
  }
  function equals(value: EQUALS): validator<Args> {
    return (...args) =>
      leafValidation(value.eq[0])(...args) ===
      leafValidation(value.eq[1])(...args);
  }
  interface NOTEQUALS {
    neq: [Ref, Ref];
  }
  function isNotEquals(value: validationSchema): value is NOTEQUALS {
    return 'neq' in value;
  }
  function notEquals(value: NOTEQUALS): validator<Args> {
    return (...args) =>
      leafValidation(value.neq[0])(...args) !==
      leafValidation(value.neq[1])(...args);
  }
  interface ISDEFINED {
    isDefined: Ref;
  }
  function isIsDefined(value: validationSchema): value is ISDEFINED {
    return 'isDefined' in value;
  }
  function isDefined(value: ISDEFINED): validator<Args> {
    return (...args) => {
      const v = leafValidation(value.isDefined)(...args);
      return v != null && v != undefined;
    };
  }
  interface ISTRUE {
    isTrue: Ref;
  }
  function isIsTrue(value: validationSchema): value is ISTRUE {
    return 'isTrue' in value;
  }
  function isTrue(value: ISTRUE): validator<Args> {
    return (...args) => leafValidation(value.isTrue)(...args) === true;
  }
  interface ISFALSE {
    isFalse: Ref;
  }
  function isIsFalse(value: validationSchema): value is ISFALSE {
    return 'isFalse' in value;
  }
  function isFalse(value: ISFALSE): validator<Args> {
    return (...args) => leafValidation(value.isFalse)(...args) === false;
  }
  interface LESSTHAN {
    lt: [Ref, Ref];
  }
  function isLessThan(value: validationSchema): value is LESSTHAN {
    return 'lt' in value;
  }
  function lessThan(value: LESSTHAN): validator<Args> {
    return (...args) => {
      const a = leafValidation(value.lt[0])(...args);
      const b = leafValidation(value.lt[1])(...args);
      return typeof a === 'number' && typeof b === 'number' && a < b;
    };
  }
  interface LESSTHANOREQUALS {
    lte: [Ref, Ref];
  }
  function isLessThanOrEquals(
    value: validationSchema,
  ): value is LESSTHANOREQUALS {
    return 'lte' in value;
  }
  function lessThanOrEquals(value: LESSTHANOREQUALS): validator<Args> {
    return (...args) => {
      const a = leafValidation(value.lte[0])(...args);
      const b = leafValidation(value.lte[1])(...args);
      return typeof a === 'number' && typeof b === 'number' && a <= b;
    };
  }
  interface GREATERTHAN {
    gt: [Ref, Ref];
  }
  function isGreaterThan(value: validationSchema): value is GREATERTHAN {
    return 'gt' in value;
  }
  function greaterThan(value: GREATERTHAN): validator<Args> {
    return (...args) => {
      const a = leafValidation(value.gt[0])(...args);
      const b = leafValidation(value.gt[1])(...args);
      return typeof a === 'number' && typeof b === 'number' && a > b;
    };
  }
  interface GREATERTHANOREQUALS {
    gte: [Ref, Ref];
  }
  function isGreaterThanOrEquals(
    value: validationSchema,
  ): value is GREATERTHANOREQUALS {
    return 'gte' in value;
  }
  function greaterThanOrEquals(value: GREATERTHANOREQUALS): validator<Args> {
    return (...args) => {
      const a = leafValidation(value.gte[0])(...args);
      const b = leafValidation(value.gte[1])(...args);
      return typeof a === 'number' && typeof b === 'number' && a >= b;
    };
  }

  function evaluate(schema: validationSchema): validator<Args> {
    if (isAnd(schema)) {
      return and(schema);
    } else if (isOr(schema)) {
      return or(schema);
    } else if (isNot(schema)) {
      return not(schema);
    } else if (isEquals(schema)) {
      return equals(schema);
    } else if (isNotEquals(schema)) {
      return notEquals(schema);
    } else if (isIsDefined(schema)) {
      return isDefined(schema);
    } else if (isIsTrue(schema)) {
      return isTrue(schema);
    } else if (isIsFalse(schema)) {
      return isFalse(schema);
    } else if (isLessThan(schema)) {
      return lessThan(schema);
    } else if (isLessThanOrEquals(schema)) {
      return lessThanOrEquals(schema);
    } else if (isGreaterThan(schema)) {
      return greaterThan(schema);
    } else if (isGreaterThanOrEquals(schema)) {
      return greaterThanOrEquals(schema);
    } else {
      throw Error('Unhandled schema ' + JSON.stringify(Object.keys(schema)));
    }
  }
  return evaluate;
}
// REFS
type ref = Const | Self | Field;
interface Const<T = unknown> {
  type: 'Const';
  const: T;
}
interface Self {
  type: 'Self';
}
interface Field {
  type: 'Field';
  classFilter?: string;
  fieldName: string;
}
function formLeaf(
  ref: ref,
): (
  val: unknown,
  formValue: IAbstractEntity & { [key: string]: {} },
  path: string[],
) => unknown {
  switch (ref.type) {
    case 'Const':
      return () => ref.const;
    case 'Self':
      return val => val;
    case 'Field':
      return (_val, formVal, path) => {
        if (ref.classFilter == null) {
          return formVal[ref.fieldName];
        }
        const parent:
          | IAbstractEntity & { [key: string]: {} }
          | undefined = findNearestParent(formVal, path, ref.classFilter);
          if (ref.fieldName){
            return parent ? parent[ref.fieldName] : undefined;
          } else {
            return parent;
          }
      };
  }
  throw Error('Unhandled reference: ' + JSON.stringify(ref));
}
/**
 * generate visible function from validation schema
 */
export const formValidation = validation(formLeaf);
