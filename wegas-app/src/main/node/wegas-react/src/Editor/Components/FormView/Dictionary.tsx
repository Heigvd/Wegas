import * as React from 'react';
import { WidgetProps } from 'jsoninput/typings/types';
import { CommonViewContainer, CommonView } from './commonView';
import Form from 'jsoninput';
import { omit } from 'lodash-es';
import { useDeepChanges } from '../../../Components/Hooks/useDeepChanges';
import {
  schemaProps,
  SchemaPropsSchemas,
} from '../../../Components/PageComponents/tools/schemaProps';
import { LabeledView, Labeled } from './labeled';
import { DragDropArray } from './Array';
import { legendStyle, reset, borderTopStyle } from './Object';
import { cx } from '@emotion/css';
import { Button } from '../../../Components/Inputs/Buttons/Button';

interface ObjectValues {
  [key: string]: string | number | ObjectValues;
}

interface ImprovedObjectValue {
  value: string | ImprovedValues;
  index: number;
}

type DictionaryViewBag = CommonView &
  LabeledView & {
    disabled?: boolean;
    tooltip?: string;
    objectViewStyle?: boolean;
    cleaning?: CleaningHashmapMethods;
    keySchema?: SchemaPropsSchemas;
    valueSchema?: SchemaPropsSchemas;
  };

interface EntryViewProps<T> {
  prop: string;
  value: T | undefined;
  onChange: (key: string, value: T) => void;
  keySchema?: SchemaPropsSchemas;
  valueSchema?: SchemaPropsSchemas;
}

export function EntryView<T>({
  prop,
  value,
  onChange,
  keySchema,
  valueSchema,
}: EntryViewProps<T>) {
  return (
    <Form
      schema={{
        description: 'EntryView',
        properties: {
          prop: keySchema
            ? keySchema
            : schemaProps.string({
                label: 'Key',
                required: true,
                value: prop,
                layout: 'shortInline',
              }),
          value: valueSchema
            ? valueSchema
            : schemaProps.string({
                label: 'Value',
                required: true,
                value:
                  value === undefined
                    ? ''
                    : typeof value === 'string'
                    ? value
                    : JSON.stringify(value),
                layout: 'shortInline',
              }),
        },
      }}
      value={{ prop, value }}
      onChange={v => onChange(v.prop, v.value)}
    />
  );
}

export type ImprovedValues = { [prop: string]: ImprovedObjectValue };

const normalizeValues =
  (nv: object) =>
  (ov?: ImprovedValues): ImprovedValues =>
    Object.entries(nv).reduce((o, [k, v], i) => {
      return {
        ...o,
        [k]: {
          value: v,
          index: ov != null && ov[k] != null ? ov[k].index : i,
        },
      };
    }, {});

const extractValues = (values: ImprovedValues): ObjectValues =>
  Object.entries(values || {}).reduce((o, [k, v]) => {
    return {
      ...o,
      [k]: typeof v.value === 'object' ? extractValues(v.value) : v.value,
    };
  }, {});
const sortValues = (a: ImprovedObjectValue, b: ImprovedObjectValue) =>
  a.index - b.index;

interface EntriesViewProps {
  currentValue: ImprovedValues;
  onNewEntry?: (value: ImprovedValues) => void;
  onChange: (value: ImprovedValues) => void;
  inputId?: string;
  labelNode?: React.ReactNode;
  view: DictionaryViewBag;
  allowChildAdd?: boolean;
  keySchema?: SchemaPropsSchemas;
  valueSchema?: SchemaPropsSchemas;
}

function EntriesView({
  currentValue,
  onNewEntry,
  onChange: onChangeOutside,
  inputId,
  labelNode,
  view,
  allowChildAdd,
  keySchema,
  valueSchema,
}: EntriesViewProps) {
  const { readOnly, disabled, tooltip } = view;

  const onChange = React.useCallback(
    (value: ImprovedValues) => {
      onChangeOutside(value);
    },
    [onChangeOutside],
  );

  return (
    <DragDropArray
      onChildAdd={
        allowChildAdd
          ? () => {
              const index = Object.keys(currentValue).length;
              onNewEntry &&
                onNewEntry({
                  ...currentValue,
                  [`key${index}`]: {
                    index,
                    value: '',
                  },
                });
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
        .map(() => true)}
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
                keySchema={keySchema}
                valueSchema={valueSchema}
              />
            );
          })}
    </DragDropArray>
  );
}

export type DictionaryViewProps = WidgetProps.ObjectProps<DictionaryViewBag>;

function DictionaryView({
  errorMessage,
  view,
  onChange: onChangeOutside,
  value,
}: DictionaryViewProps) {
  const {
    label,
    description,
    objectViewStyle,
    cleaning,
    keySchema,
    valueSchema,
  } = view;

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

  const computedLabel =
    label || cleaning ? (
      <>
        {label}
        {cleaning && cleaning.errorDetector(value) && (
          <Button
            label={'Clean value'}
            onClick={() =>
              onChange(
                normalizeValues(cleaning.cleaningMethod(value))(undefined),
              )
            }
          />
        )}
      </>
    ) : undefined;

  return (
    <>
      <CommonViewContainer errorMessage={errorMessage} view={view}>
        {objectViewStyle ? (
          <fieldset
            className={cx(reset, {
              [borderTopStyle]: computedLabel !== undefined,
            })}
          >
            <legend className={legendStyle}>{computedLabel}</legend>
            <EntriesView
              view={view}
              currentValue={currentValue}
              onNewEntry={(value: ImprovedValues) => setValue(value)}
              onChange={onChange}
              allowChildAdd
              keySchema={keySchema}
              valueSchema={valueSchema}
            />
          </fieldset>
        ) : (
          <Labeled label={computedLabel} description={description}>
            {({ inputId, labelNode }) => (
              <EntriesView
                view={view}
                currentValue={currentValue}
                onNewEntry={(value: ImprovedValues) => setValue(value)}
                onChange={onChange}
                inputId={inputId}
                labelNode={labelNode}
                allowChildAdd
                keySchema={keySchema}
                valueSchema={valueSchema}
              />
            )}
          </Labeled>
        )}
      </CommonViewContainer>
    </>
  );
}

export default DictionaryView;
