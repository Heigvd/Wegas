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
import { hidden } from '../../../css/classes';

interface ObjectValues {
  [key: string]: string | ObjectValues;
}

interface ImprovedObjectValue {
  value: string | ImprovedValues;
  index: number;
}

interface HashListProp {
  prop: string;
}

interface HashListValue {
  prop: string;
  schema: SchemaPropsSchemas;
}

type HashListItem = HashListValue | HashListProp;

function isHashListValue(item: HashListItem): item is HashListValue {
  return 'schema' in item && item.schema != null;
}

type HashListChoice = MenuItem<HashListItem> & {
  value: HashListItem;
  items?: HashListChoices;
};

export type HashListChoices = HashListChoice[];

type HashListViewBag = CommonView &
  LabeledView & {
    disabled?: boolean;
    tooltip?: string;
    choices?: HashListChoices;
  };
export type HashListViewProps = WidgetProps.ObjectProps<HashListViewBag>;

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

type ImprovedValues = { [prop: string]: ImprovedObjectValue };
const normalizeValues = (nv: object) => (ov?: ImprovedValues): ImprovedValues =>
  Object.entries(nv).reduce(
    (o, [k, v], i) => ({
      ...o,
      [k]: {
        value:
          typeof v === 'object'
            ? normalizeValues(v)(
                ov == null || ov[k] == null || typeof ov[k].value === 'string'
                  ? undefined
                  : (ov[k].value as ImprovedValues),
              )
            : v,
        index: ov != null && ov[k] != null ? ov[k].index : i,
      },
    }),
    {},
  );

const extractValues = (values: ImprovedValues): ObjectValues =>
  Object.entries(values || {}).reduce(
    (o, [k, v]) => ({
      ...o,
      [k]: typeof v.value === 'string' ? v.value : extractValues(v.value),
    }),
    {},
  );

const sortValues = (a: ImprovedObjectValue, b: ImprovedObjectValue) =>
  a.index - b.index;

const getKeyPath = (path: number[], choices: HashListChoices): string[] => {
  const newPath = [...path];
  const keyPath: string[] = [];
  let choice: HashListChoices | undefined = cloneDeep(choices);
  while (newPath.length > 0) {
    const key = newPath.shift();
    if (choice == null || key == null || choices[key] == null) {
      return keyPath;
    } else {
      keyPath.push(choice[key].value.prop);
      choice = choice[key].items;
    }
  }
  return keyPath;
};

interface EntriesViewProps {
  currentValue: ImprovedValues;
  onChange: (value: ImprovedValues) => void;
  inputId?: string;
  labelNode?: React.ReactNode;
  view: HashListViewBag;
  first?: boolean;
}

function EntriesView({
  currentValue,
  onChange: onChangeOutside,
  inputId,
  labelNode,
  view,
  first,
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
      choices={choices}
      onChildAdd={
        first
          ? choice => {
              const index = Object.keys(currentValue).length;

              if (choice && choices) {
                const keyPath = [
                  ...getKeyPath(choice.path, choices),
                  choice.value.prop,
                ];
                const newValue = setEntry(
                  currentValue,
                  { index: 0, value: '' },
                  keyPath,
                  {
                    defaultObject: { value: '', index: 0 },
                    lookupKey: 'value',
                  },
                );
                if (newValue != null) {
                  onChange(newValue);
                }
              } else {
                onChange({
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
      filterRemovable={Object.values(currentValue)
        .sort((a, b) => sortValues(a, b))
        .map(v => typeof v.value === 'string')}
    >
      {currentValue &&
        Object.entries(currentValue)
          .sort(([, a], [, b]) => sortValues(a, b))
          .map(([k, v], i) => {
            let schema: SchemaPropsSchemas | undefined;
            let label: React.ReactNode | undefined;
            let newChoices: HashListChoices | undefined;
            if (choices) {
              const choice: HashListChoice | undefined = choices.find(
                c => c.value.prop === k,
              );
              label = choice?.label;
              if (choice && choice.value && isHashListValue(choice.value)) {
                schema = choice.value.schema;
              } else {
                newChoices = choice?.items;
              }
            }

            if (typeof v.value === 'string') {
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
            } else {
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
                    choices: newChoices,
                  }}
                  key={i}
                />
              );
            }
          })}
    </DragDropArray>
  );
}

function HashListView({
  errorMessage,
  view,
  onChange: onChangeOutside,
  value,
}: HashListViewProps) {
  const { label, description } = view;

  const onChange = React.useCallback(
    (value?: ImprovedValues) => {
      setValue(value || {});
      onChangeOutside(extractValues(value || {}));
    },
    [onChangeOutside],
  );

  const [currentValue, setValue] = React.useState<ImprovedValues>({});
  useDeepChanges(value, nv => {
    setValue(normalizeValues(nv || {}));
  });

  const visitChoices = (
    choices: HashListChoices,
    visitorFn: (choice: HashListChoice, path: number[]) => HashListChoice,
    path: number[] = [],
  ): HashListChoices =>
    choices.map((c, i) => ({
      ...visitorFn(c, [...path, i]),
      items: c.items
        ? visitChoices(c.items, visitorFn, [...path, i])
        : undefined,
    }));

  const choices = view.choices
    ? visitChoices(view.choices, (choice, path) => {
        if (view.choices) {
          const keyPath = getKeyPath(path, view.choices);
          const newValue: ImprovedObjectValue = getEntry(
            currentValue,
            keyPath,
            'value',
          );
          if (newValue != null && choice.items == null) {
            return { ...choice, className: hidden };
          }
        }
        return { ...choice, className: undefined };
      })
    : undefined;

  return (
    <CommonViewContainer errorMessage={errorMessage} view={view}>
      <Labeled label={label} description={description}>
        {({ inputId, labelNode }) => (
          <EntriesView
            view={{ ...view, choices }}
            currentValue={currentValue}
            onChange={onChange}
            inputId={inputId}
            labelNode={labelNode}
            first
          />
        )}
      </Labeled>
    </CommonViewContainer>
  );
}

export default HashListView;
