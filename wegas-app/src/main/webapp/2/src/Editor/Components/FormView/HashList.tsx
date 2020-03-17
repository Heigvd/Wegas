import * as React from 'react';
import { WidgetProps } from 'jsoninput/typings/types';
import { CommonViewContainer, CommonView } from './commonView';
import Form from 'jsoninput';
import { omit } from 'lodash-es';
import { useDeepChanges } from '../../../Components/Hooks/useDeepChanges';
import { schemaProps } from '../../../Components/PageComponents/tools/schemaProps';
import { LabeledView, Labeled } from './labeled';
import { DragDropArray } from './Array';
import { wlog } from '../../../Helper/wegaslog';

interface ImprovedObjectValue {
  value: string;
  index: number;
}

interface EntryViewProps<T> {
  prop: string;
  value: T;
  onChange: (key: string, value: T) => void;
}

export function EntryView<T>({ prop, value, onChange }: EntryViewProps<T>) {
  return (
    <Form
      schema={{
        description: 'EntryView',
        properties: {
          prop: schemaProps.string(
            'Key',
            true,
            prop,
            'DEFAULT',
            undefined,
            'shortInline',
          ),
          value: schemaProps.string(
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
const normalizeValues = (nv: object) => (
  ov: ImprovedValues,
): ImprovedValues => {
  const newValues = Object.entries(nv).reduce(
    (o, [k, v], i) => ({
      ...o,
      [k]: { value: v, index: ov[k] != null ? ov[k].index : i },
    }),
    {},
  );
  return newValues;
};

const extractValues = (values: ImprovedValues) =>
  Object.entries(values || {}).reduce(
    (o, [k, v]) => ({ ...o, [k]: v.value }),
    {},
  );

const sortValues = (a: ImprovedObjectValue, b: ImprovedObjectValue) =>
  a.index - b.index;

function HashListView({
  errorMessage,
  view,
  onChange: onChangeOutside,
  value,
}: WidgetProps.ObjectProps<
  CommonView & LabeledView & { disabled?: boolean; tooltip?: string }
>) {
  const { label, readOnly, disabled, description, tooltip } = view;

  const onChange = React.useCallback(
    (value?: ImprovedValues) => {
      // wlog('CHANGES');
      // wlog(value);
      // debugger;
      // onChangeOutside(value);
      onChangeOutside(extractValues(value || {}));
    },
    [onChangeOutside],
  );

  const [currentValue, setValue] = React.useState<ImprovedValues>({});
  useDeepChanges(value, nv => {
    // wlog('NEW');
    // wlog(value);
    // debugger;
    // setValue(nv);
    setValue(normalizeValues(nv || {}));
  });
  // useDeepChanges(currentValue, onChange);

  return (
    <CommonViewContainer errorMessage={errorMessage} view={view}>
      <Labeled label={label} description={description}>
        {({ inputId, labelNode }) => (
          <DragDropArray
            onChildAdd={() => {
              const index = Object.keys(currentValue).length;
              onChange({
                ...currentValue,
                [`key${index}`]: { index, value: '' },
              });
            }}
            onChildRemove={i => {
              onChange(
                Object.entries(currentValue)
                  .filter(([, v]) => v.index !== i)
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
                .map(([k, v], i) => (
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
                      setValue(newValue);
                      onChange(newValue);
                    }}
                  />
                ))}
          </DragDropArray>
        )}
      </Labeled>
    </CommonViewContainer>
  );
}

export default HashListView;
