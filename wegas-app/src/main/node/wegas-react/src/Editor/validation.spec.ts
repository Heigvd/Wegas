import { validation } from './validation';
import { IAbstractEntity } from 'wegas-ts-api';
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
// mimic Wegas validation without accessing db
function leafs(ref: ref): (val: {}, formValue: {}) => unknown {
  switch (ref.type) {
    case 'Const':
      return () => ref.const;
    case 'Self':
      return val => val;
    case 'Field':
      return (_val: {}, formVal: IAbstractEntity & { [key: string]: {} }) => {
        return (
          // @ts-ignore
          formVal[ref.fieldName]
        );
      };
  }
  throw Error('Unhandled reference: ' + JSON.stringify(ref));
}
const jsoninputValidator = validation(leafs);
test('MaxReplies visibility', () => {
  const validator = jsoninputValidator({
    not: {
      or: [
        {
          and: [
            {
              isDefined: {
                type: 'Field',
                classFilter: 'QuestionDescriptor',
                fieldName: 'cbx',
              },
            },
            {
              isTrue: {
                type: 'Field',
                classFilter: 'QuestionDescriptor',
                fieldName: 'cbx',
              },
            },
          ],
        },
        {
          and: [
            {
              isDefined: {
                type: 'Field',
                classFilter: 'QuestionDescriptor',
                fieldName: 'maxReplies',
              },
            },
            {
              eq: [
                {
                  type: 'Field',
                  classFilter: 'QuestionDescriptor',
                  fieldName: 'maxReplies',
                },
                {
                  type: 'Const',
                  const: 1,
                },
              ],
            },
          ],
        },
      ],
    },
  });
  expect(validator({}, {})).toBe(true);
  expect(validator({}, { maxReplies: 1 })).toBe(false);
});
test('Boolean operations', () => {
  const neqValidation = jsoninputValidator({
    neq: [{ type: 'Self' }, { type: 'Const', const: 2 }],
  });
  expect(neqValidation(4, {})).toBe(true);
  const trueValidation = jsoninputValidator({
    isTrue: { type: 'Const', const: true },
  });
  expect(trueValidation({}, {})).toBe(true);
  const falseValidation = jsoninputValidator({
    isFalse: { type: 'Const', const: true },
  });
  expect(falseValidation({}, {})).toBe(false);
});
test('Number comparison', () => {
  const ltValidation = jsoninputValidator({
    lt: [{ type: 'Self' }, { type: 'Const', const: 6 }],
  });
  expect(ltValidation(3, {})).toBe(true);
  expect(ltValidation(6, {})).toBe(false);
  expect(ltValidation(8, {})).toBe(false);
  const lteValidation = jsoninputValidator({
    lte: [{ type: 'Self' }, { type: 'Const', const: 6 }],
  });
  expect(lteValidation(3, {})).toBe(true);
  expect(lteValidation(6, {})).toBe(true);
  expect(lteValidation(8, {})).toBe(false);
  const gtValidation = jsoninputValidator({
    gt: [{ type: 'Self' }, { type: 'Const', const: 6 }],
  });
  expect(gtValidation(8, {})).toBe(true);
  expect(gtValidation(6, {})).toBe(false);
  expect(gtValidation(1, {})).toBe(false);
  const gteValidation = jsoninputValidator({
    gte: [{ type: 'Self' }, { type: 'Const', const: 6 }],
  });
  expect(gteValidation(8, {})).toBe(true);
  expect(gteValidation(6, {})).toBe(true);
  expect(gteValidation(1, {})).toBe(false);
});
test('Unknown validation', () => {
  expect(() =>
    jsoninputValidator({
      // @ts-ignore
      u: [],
    }),
  ).toThrow(/^Unhandled schema: /);
});
