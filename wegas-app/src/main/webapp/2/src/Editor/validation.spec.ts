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
  fieldName: string;
}
function leafs(ref: ref): (val: {}, formValue: {}) => unknown {
  switch (ref.type) {
    case 'Const':
      return () => ref.const;
    case 'Self':
      return val => val;
    case 'Field':
      return (_val: {}, formVal: IWegasEntity & { [key: string]: {} }) => {
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
