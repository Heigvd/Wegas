import * as React from 'react';
import { WidgetProps } from 'jsoninput/typings/types';
import { CommonViewContainer, CommonView } from './commonView';
import Form from 'jsoninput';
import { omit, cloneDeep } from 'lodash-es';
import { useDeepChanges } from '../../../Components/Hooks/useDeepChanges';
import {
  schemaProps,
  SchemaPropsSchemas,
} from '../../../Components/PageComponents/tools/schemaProps';
import { LabeledView, Labeled } from './labeled';
import { DragDropArray } from './Array';
import { MenuItem } from '../../../Components/Menu';
import { setEntry, getEntry } from '../../../Helper/tools';
import { legendStyle, reset, borderTopStyle } from './Object';
import { cx } from 'emotion';

interface ObjectValues {
  [key: string]: string | number | ObjectValues;
}

interface ImprovedObjectValue {
  value: string | ImprovedValues;
  index: number;
}

interface HashListProp {
  prop: string;
}

// interface HashListValueSchema {
//   [key: string]: SchemaPropsSchemas;
// }

interface HashListValue {
  prop: string;
  schema: SchemaPropsSchemas;
}

type HashListItem = HashListValue | HashListProp;

function isHashListValue(item: HashListItem): item is HashListValue {
  return 'schema' in item && item.schema != null;
}

export type HashListChoice = MenuItem<HashListItem> & {
  value: HashListItem;
  items?: HashListChoices;
};

export type HashListChoices = HashListChoice[];

function isIntermediateKey(
  key?: string,
  choices?: HashListChoices,
): [boolean, HashListChoices | undefined] {
  const choice = choices?.find(c => c.value.prop === key);
  return [key != null && choice != null && choice.items != null, choice?.items];
}

type HashListViewBag = CommonView &
  LabeledView & {
    disabled?: boolean;
    tooltip?: string;
    choices?: HashListChoices;
    objectViewStyle?: boolean;
  };

interface EntryViewProps<T> {
  prop: string;
  value: T | undefined;
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
            ? schema
            : // {
              //   ...schema,
              //   view: {
              //     ...schema.view,
              //     layout: 'shortInline',
              //   },
              // }
              schemaProps.string(
                'Value',
                true,
                value === undefined
                  ? ''
                  : typeof value === 'string'
                  ? value
                  : JSON.stringify(value),
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

type ImprovedValues = { [prop: string]: ImprovedObjectValue };
const normalizeValues = (nv: object, choices?: HashListChoices) => (
  ov?: ImprovedValues,
): ImprovedValues =>
  Object.entries(nv).reduce((o, [k, v], i) => {
    const [isIntermediate, itemChoices] = isIntermediateKey(k, choices);
    return {
      ...o,
      [k]: {
        value: isIntermediate
          ? normalizeValues(
              v,
              itemChoices,
            )(
              ov == null || ov[k] == null
                ? undefined
                : (ov[k].value as ImprovedValues),
            )
          : v,
        index: ov != null && ov[k] != null ? ov[k].index : i,
      },
    };
  }, {});

const extractValues = (
  values: ImprovedValues,
  choices?: HashListChoices,
): ObjectValues =>
  Object.entries(values || {}).reduce((o, [k, v]) => {
    const [isIntermediate, itemChoices] = isIntermediateKey(k, choices);
    return {
      ...o,
      [k]:
        isIntermediate && typeof v.value === 'object'
          ? extractValues(v.value, itemChoices)
          : v.value,
    };
  }, {});
const sortValues = (a: ImprovedObjectValue, b: ImprovedObjectValue) =>
  a.index - b.index;

const getKeyPath = (
  path: number[],
  choices: HashListChoices,
): string[] | undefined => {
  const newPath = [...path];
  const keyPath: string[] = [];
  let choice: HashListChoices | undefined = cloneDeep(choices);
  while (newPath.length > 0) {
    const key = newPath.shift();
    if (choice == null || key == null || choice[key] == null) {
      return;
    } else {
      keyPath.push(choice[key].value.prop);
      choice = choice[key].items;
    }
  }
  return keyPath;
};

interface EntriesViewProps {
  currentValue: ImprovedValues;
  onNewEntry?: (value: ImprovedValues) => void;
  onChange: (value: ImprovedValues) => void;
  inputId?: string;
  labelNode?: React.ReactNode;
  view: HashListViewBag;
  allowedChoices?: HashListChoices;
  allowChildAdd?: boolean;
}

function EntriesView({
  currentValue,
  onNewEntry,
  onChange: onChangeOutside,
  inputId,
  labelNode,
  view,
  allowedChoices,
  allowChildAdd,
}: EntriesViewProps) {
  const { readOnly, disabled, tooltip, choices } = view;

  const onChange = React.useCallback(
    (value: ImprovedValues) => {
      onChangeOutside(value);
    },
    [onChangeOutside],
  );

  return (
    <DragDropArray
      choices={allowedChoices}
      onChildAdd={
        allowChildAdd
          ? choice => {
              const index = Object.keys(currentValue).length;
              if (choice && choices) {
                const choiceKeyPath = getKeyPath(choice.path, choices);
                if (choiceKeyPath != null) {
                  const keyPath = [...choiceKeyPath, choice.value.prop];
                  const newValue = setEntry(
                    currentValue,
                    { index: 0, value: undefined },
                    keyPath,
                    {
                      defaultObject: { index: 0, value: '' },
                      lookupKey: 'value',
                    },
                  );
                  if (newValue != null) {
                    onNewEntry && onNewEntry(newValue);
                  }
                }
              } else {
                onNewEntry &&
                  onNewEntry({
                    ...currentValue,
                    [`key${index}`]: {
                      index,
                      value: '',
                    },
                  });
              }
            }
          : undefined
      }
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
      filterRemovable={Object.entries(currentValue)
        .sort(([, a], [, b]) => sortValues(a, b))
        .map(([k]) => !isIntermediateKey(k, choices)[0])}
    >
      {currentValue &&
        Object.entries(currentValue)
          .sort(([, a], [, b]) => sortValues(a, b))
          .map(([k, v], i) => {
            let schema: SchemaPropsSchemas | undefined;
            let label: React.ReactNode | undefined;
            // let newChoices: HashListChoices | undefined;
            if (choices) {
              const choice: HashListChoice | undefined = choices.find(
                c => c.value.prop === k,
              );
              label = choice?.label;
              if (choice && choice.value && isHashListValue(choice.value)) {
                schema = choice.value.schema;
              }
            }
            const [isIntermediate, itemChoices] = isIntermediateKey(k, choices);
            if (isIntermediate && typeof v.value === 'object') {
              return (
                <EntriesView
                  labelNode={label}
                  currentValue={v.value}
                  onChange={value => {
                    let newValue: ImprovedValues;
                    const nestedValue = { ...v, value };
                    if (Object.keys(nestedValue.value).length > 0) {
                      newValue = { ...currentValue, [k]: nestedValue };
                    } else {
                      newValue = omit(currentValue, k);
                    }
                    onChange(newValue);
                  }}
                  view={{
                    ...view,
                    choices: itemChoices,
                  }}
                  key={i}
                />
              );
            } else {
              return (
                <EntryView
                  key={i}
                  prop={k}
                  value={v.value}
                  onChange={(newKey, newVal) => {
                    const safeNewKey =
                      newKey === k || currentValue[newKey] == null
                        ? newKey
                        : newKey + ' - copy';
                    const newValue = {
                      ...omit(currentValue, k),
                      [safeNewKey]: {
                        ...(currentValue ? currentValue[k] : { index: i }),
                        value: newVal,
                      },
                    };
                    onChange(newValue);
                  }}
                  schema={schema}
                />
              );
            }
          })}
    </DragDropArray>
  );
}

const visitChoices = (
  choices: HashListChoices,
  visitorFn: (
    choice: HashListChoice,
    path: number[],
  ) => HashListChoice | undefined,
  path: number[] = [],
): HashListChoices =>
  choices
    .map((c, i) => {
      const visitedChoice = visitorFn(c, [...path, i]);
      return visitedChoice
        ? {
            ...visitorFn(c, [...path, i]),
            items: c.items
              ? visitChoices(c.items, visitorFn, [...path, i])
              : undefined,
          }
        : undefined;
    })
    .filter(c => c != undefined) as HashListChoices;

export type HashListViewProps = WidgetProps.ObjectProps<HashListViewBag>;

function HashListView({
  errorMessage,
  view,
  onChange: onChangeOutside,
  value,
}: HashListViewProps) {
  const { label, description, choices, objectViewStyle } = view;

  const onChange = React.useCallback(
    (value?: ImprovedValues) => {
      setValue(value || {});
      onChangeOutside(extractValues(value || {}, choices));
    },
    [onChangeOutside, choices],
  );

  const [currentValue, setValue] = React.useState<ImprovedValues>({});
  useDeepChanges(value, nv => {
    setValue(normalizeValues(nv || {}, choices));
  });

  const allowedChoices = view.choices
    ? visitChoices(view.choices, (choice, path) => {
        if (view.choices) {
          const keyPath = getKeyPath(path, view.choices);
          if (keyPath != null) {
            const newValue: ImprovedObjectValue = getEntry(
              currentValue,
              keyPath,
              'value',
            );
            if (newValue != null && choice.items == null) {
              return undefined;
            }
          }
        }
        return choice;
      })
    : undefined;

  return (
    <>
      <CommonViewContainer errorMessage={errorMessage} view={view}>
        {objectViewStyle ? (
          <fieldset
            className={cx(reset, {
              [borderTopStyle]: label !== undefined,
            })}
          >
            <legend className={legendStyle}>{label}</legend>
            <EntriesView
              view={view}
              allowedChoices={allowedChoices}
              currentValue={currentValue}
              onNewEntry={(value: ImprovedValues) => setValue(value)}
              onChange={onChange}
              allowChildAdd
            />
          </fieldset>
        ) : (
          <Labeled label={label} description={description}>
            {({ inputId, labelNode }) => (
              <EntriesView
                view={view}
                allowedChoices={allowedChoices}
                currentValue={currentValue}
                onNewEntry={(value: ImprovedValues) => setValue(value)}
                onChange={onChange}
                inputId={inputId}
                labelNode={labelNode}
                allowChildAdd
              />
            )}
          </Labeled>
        )}
      </CommonViewContainer>
    </>
  );
}

export default HashListView;
