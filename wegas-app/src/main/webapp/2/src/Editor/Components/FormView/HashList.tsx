import * as React from 'react';
import { WidgetProps } from 'jsoninput/typings/types';
import { CommonViewContainer, CommonView } from './commonView';
import Form from 'jsoninput';
import { omit, cloneDeep, isArray } from 'lodash-es';
import { useDeepChanges } from '../../../Components/Hooks/useDeepChanges';
import {
  schemaProps,
  SchemaPropsSchemas,
} from '../../../Components/PageComponents/tools/schemaProps';
import { LabeledView, Labeled } from './labeled';
import { DragDropArray } from './Array';
import { Item } from '../Tree/TreeSelect';
import { wlog } from '../../../Helper/wegaslog';
import { SelectedMenuItem } from '../../../Components/Menu';

interface ImprovedObject {
  path: number[];
  index: number;
}

interface ImprovedFlattenObjectValue extends ImprovedObject {
  value: string;
}

interface ImprovedObjectValue extends ImprovedObject {
  value: ImprovedValues;
}

type ObjectValue = ImprovedFlattenObjectValue | ImprovedObjectValue;

type ImprovedValues = { [prop: string]: ObjectValue };

type FlattenImprovedValues = { [prop: string]: ImprovedFlattenObjectValue };

function isFlattenImprovedValue(
  value: ObjectValue,
): value is ImprovedFlattenObjectValue {
  return typeof value.value === 'string';
}

function isFlattenImprovedValues(
  values: ImprovedValues | FlattenImprovedValues,
): values is FlattenImprovedValues {
  return Object.values(values).every(isFlattenImprovedValue);
}

type HashListCategoryValue = {
  prop: string;
};

export interface HashListCategory extends Item<HashListCategoryValue> {
  value: HashListCategoryValue;
  items: HashListChoices;
}

interface HashListChoiceValue extends HashListCategoryValue {
  schema: SchemaPropsSchemas;
}

export interface HashListChoice
  extends Omit<Item<HashListChoiceValue>, 'items'> {
  value: HashListChoiceValue;
}

export type HashListChoices = (HashListCategory | HashListChoice)[];

function isHashListCategory(
  item: HashListCategory | HashListChoice,
): item is HashListCategory {
  return 'items' in item;
}

export type HashListViewProps = WidgetProps.ObjectProps<
  CommonView &
    LabeledView & {
      disabled?: boolean;
      tooltip?: string;
      choices: HashListChoices;
    }
>;

interface EntryViewProps<T> {
  prop: string;
  value: T;
  onChange: (key: string, value: T) => void;
  schema?: SchemaPropsSchemas;
}

export function EntryView<T>({
  prop,
  value,
  onChange,
  schema,
}: EntryViewProps<T>) {
  return (
    <Form
      schema={{
        description: 'EntryView',
        properties: {
          prop: schema
            ? schemaProps.hidden(true, 'string')
            : schemaProps.string(
                'Key',
                true,
                prop,
                'DEFAULT',
                undefined,
                'shortInline',
                false,
              ),
          value: schema
            ? {
                ...schema,
                view: {
                  ...schema.view,
                  layout: 'shortInline',
                },
              }
            : schemaProps.string(
                'Value',
                true,
                typeof value === 'string' ? value : JSON.stringify(value),
                'DEFAULT',
                undefined,
                'shortInline',
              ),
        },
      }}
      value={{ prop, value }}
      onChange={v => onChange(v.prop, v.value)}
    />
  );
}

const normalizeValues = (nv: object, choices?: HashListChoices) => (
  ov: ImprovedValues,
): ImprovedValues => {
  const newValues = Object.entries(nv).reduce((o, [k, v], i) => {
    const newPath: number[] = [];

    if (choices) {
      const splittedKey = k.split('\\');
      debugger;
    }

    return {
      ...o,
      [k]: { value: v, index: ov[k] != null ? ov[k].index : i, path: newPath },
    };
  }, {});
  return newValues;
};

const extractValues = (values: ImprovedValues, choices?: HashListChoices) => {
  const newValues = {};

  for (const [key, value] of Object.entries(values)) {
    const newPath = [...value.path];
    let entry: { [id: string]: {} } = newValues;
    let choice: HashListChoices | undefined = choices;
    const propPath: string[] = [];
    while (newPath.length > 0) {
      const index = newPath.pop();
      if (index != null && choice != null) {
        //Getting the choice Item
        const newChoice = choice[index];

        //Adding the prop to the prop path
        propPath.push(newChoice.value.prop);
        if ('items' in newChoice) {
          // Following the path to choice items
          choice = newChoice.items;

          //Making an empty object for next passage
          if (entry[newChoice.value.prop] == null) {
            entry[newChoice.value.prop] = {};
          }
          entry = entry[newChoice.value.prop];
        } else {
          //Filling the entry with the value
          entry[newChoice.value.prop] = value.value;
          break;
        }
      } else {
        break;
      }
    }
    // Set the key + value on the last entry
    entry[key] = value.value;
  }

  return newValues;

  // return Object.entries(values || {}).reduce(
  //   (o, [k, v]) => ({ ...o, [k]: v.value }),
  //   {},
  // );
};

const sortValues = (a: ImprovedObjectValue, b: ImprovedObjectValue) =>
  a.index - b.index;

const flattenChoices = (
  choices: HashListChoices = [],
  key: string = '',
  flattenedChoices: { [pryop: string]: SchemaPropsSchemas } = {},
): { [prop: string]: SchemaPropsSchemas } => {
  for (const choice of choices) {
    const newKey = key + choice.label;
    if (isHashListCategory(choice)) {
      flattenChoices(choice.items, newKey + '\\', flattenedChoices);
    } else {
      flattenedChoices[newKey] = choice.value.schema;
    }
  }
  return flattenedChoices;
};

function flattenKey(
  keyIndex: number,
  choice?: SelectedMenuItem<HashListCategoryValue>,
  choices?: HashListChoices,
) {
  let newKey = '';
  if (choices != null) {
    let currentChoices: HashListChoices = choices;
    const path = [...(choice?.path || [])];
    while (path.length > 0 && choice) {
      const pathIndex = path.pop();
      if (pathIndex != null) {
        const newChoicePath = currentChoices[pathIndex];
        newKey = newChoicePath.value.prop + '\\' + newKey;
        if (isHashListCategory(newChoicePath)) {
          currentChoices = newChoicePath.items;
        } else {
          break;
        }
      }
    }
  }
  newKey +=
    choice && choice.value ? String(choice.value.prop) : `key${keyIndex}`;
  return newKey;
}

const flattenValues = (
  currentValues: ImprovedValues | FlattenImprovedValues,
): FlattenImprovedValues => {
  let flattenedValues: FlattenImprovedValues = {};
  for (const [key, value] of Object.entries(currentValues)) {
    if (isFlattenImprovedValue(value)) {
      flattenedValues = { ...flattenedValues, [key]: value };
    } else {
      flattenedValues = flattenValues(value.value);
    }
  }
  return flattenedValues;
};

function HashListView({
  errorMessage,
  view,
  onChange: onChangeOutside,
  value,
}: HashListViewProps) {
  const { label, readOnly, disabled, description, tooltip, choices } = view;
  const [flattenedChoices, setFlattenedChoices] = React.useState<{
    [prop: string]: SchemaPropsSchemas;
  }>({});

  React.useEffect(() => {
    setFlattenedChoices(flattenChoices(choices));
  }, [choices]);

  const onChange = React.useCallback(
    (value?: ImprovedValues) => {
      onChangeOutside(extractValues(value || {}, choices));
    },
    [onChangeOutside, choices],
  );

  const [currentValue, setValue] = React.useState<ImprovedValues>({});
  useDeepChanges(value, nv => {
    setValue(normalizeValues(nv || {}, choices));
  });

  // const choices = patternProperties
  //   ? Object.keys(patternProperties)
  //       .filter(k => !Object.keys(currentValue).includes(k))
  //       .map(k => ({
  //         label: k,
  //         value: k,
  //       }))
  //   : undefined;
  // const entrySchema = choices

  if (currentValue) {
    const test = flattenValues(currentValue);
    wlog(test);
    debugger;
  }

  return (
    <CommonViewContainer errorMessage={errorMessage} view={view}>
      <Labeled label={label} description={description}>
        {({ inputId, labelNode }) => (
          <DragDropArray
            choices={choices}
            onChildAdd={choice => {
              const index = Object.keys(currentValue).length;
              const newKey =
                choice && choice.value
                  ? String(choice.value.prop)
                  : `key${index}`;

              onChange({
                ...currentValue,
                // [flattenKey(index, choice, choices)]: {
                [newKey]: {
                  index,
                  value: '',
                  path: choice?.path || [],
                },
              });
            }}
            onChildRemove={i => {
              onChange(
                Object.entries(currentValue)
                  .filter((_kv, vI) => vI !== i)
                  .reduce((o, [k, v]) => ({ ...o, [k]: v }), {}),
              );
            }}
            array={Object.values(currentValue)}
            disabled={disabled}
            readOnly={readOnly}
            inputId={inputId}
            label={labelNode}
            tooltip={tooltip}
          >
            {currentValue &&
              Object.entries(currentValue)
                .sort(([, a], [, b]) => sortValues(a, b))
                .map(([k, v], i) => {
                  return (
                    <EntryView
                      key={i}
                      prop={k}
                      value={v.value}
                      onChange={(newKey, newVal) => {
                        // const newValue = cloneDeep(currentValue);

                        const safeNewKey =
                          newKey === k || currentValue[newKey] == null
                            ? newKey
                            : newKey + ' - copy';

                        // const path = cloneDeep(choice?.path || []);
                        // let entry = newValue;
                        // while(path.length > 0){
                        //   const index = path.pop();
                        //   if(index != null){
                        //     entry = entry[choices[path.pop()]]
                        //   }
                        // }

                        const newValue = {
                          ...omit(currentValue, k),
                          [safeNewKey]: {
                            ...(currentValue ? currentValue[k] : { index: i }),
                            value: newVal,
                          },
                        };
                        setValue(newValue);
                        onChange(newValue);
                      }}
                      schema={flattenedChoices[k]}
                    />
                  );
                })}
          </DragDropArray>
        )}
      </Labeled>
    </CommonViewContainer>
  );
}

export default HashListView;
