/*
 * Wegas specific Leaf validation for Form
 */
import { IAbstractEntity } from 'wegas-ts-api/typings/WegasEntities';
import { findNearestParent } from '../data/selectors/Helper';
import { validation } from './validation';

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
  fieldName?: string;
}
function formLeaf(
  ref: ref,
): (
  val: unknown,
  formValue: IAbstractEntity & { [key: string]: unknown },
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
          if (ref.fieldName != null) {
            return formVal[ref.fieldName];
          }
          return formVal;
        }
        const parent:
          | (IAbstractEntity & { [key: string]: UnknownValuesObject })
          | undefined = findNearestParent(formVal, path, ref.classFilter);
        if (ref.fieldName != null) {
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
