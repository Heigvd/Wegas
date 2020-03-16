import * as React from 'react';
import { css, cx } from 'emotion';
import { WidgetProps } from 'jsoninput/typings/types';
import { CommonViewContainer, CommonView } from './commonView';
import { IconButton } from '../../../Components/Inputs/Buttons/IconButton';
import Form from 'jsoninput';
import { values, omit } from 'lodash-es';
import { useDeepChanges } from '../../../Components/Hooks/useDeepChanges';
import {
  schemaProps,
  SchemaPropsSchemas,
  SchemaPropsValues,
} from '../../../Components/PageComponents/tools/schemaProps';
import { wlog } from '../../../Helper/wegaslog';
import { ViewTypes } from '.';

const borderTopStyle = css({
  borderWidth: '1px 0 0 0',
});
const reset = css({
  border: '0px solid #b3b3b3',
  padding: 0,
  margin: 0,
});
const legendStyle = css({
  color: '#b3b3b3',
  textAlign: 'center',
});

interface ImprovedObjectValue {
  value: {};
  index: number;
  // keyView:"string" | "select"
  // viewType:ViewTypes;
}

type CastedValue = ImprovedObjectValue;

interface EntryViewProps<T extends CastedValue> {
  prop: string;
  value: T;
  onChange: (key: string, value: T) => void;
}

export function EntryView<T extends CastedValue>({
  prop,
  value,
  onChange,
}: EntryViewProps<T>) {
  if (typeof value !== 'string') {
    debugger;
  }
  return typeof value === 'string' ? (
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
            value,
            'DEFAULT',
            undefined,
            'shortInline',
          ),
        },
      }}
      value={{ prop, value }}
      onChange={v => onChange(v.prop, v.value)}
    />
  ) : (
    <pre>DO IT!</pre>
  );
}

type CastedValues = { [prop: string]: CastedValue } | undefined | null;
type ImprovedValues =
  | { [prop: string]: ImprovedObjectValue }
  | undefined
  | null;

const normalizeValues = (nv: CastedValues) => (
  ov: CastedValues,
): ImprovedValues => {
  const newValues: {} = Object.entries({ ...(ov ? ov : {}), ...(nv ? nv : {}) })
    .sort((av, bv) => {
      if (
        av[1] == null ||
        typeof av[1] === 'string' ||
        bv[1] == null ||
        typeof bv[1] === 'string'
      ) {
        return 0;
      } else {
        return (av[1].index || 0) - (bv[1].index || 0);
      }
    })
    .reduce(
      (ov, v, i) => ({
        ...ov,
        [v[0]]:
          v[1] == null || typeof v[1] === 'string'
            ? { value: v[1], index: i }
            : { ...v[1], index: v[1].index || i },
      }),
      {},
    );
  return newValues;
};

function HashMapView(
  props: WidgetProps.ObjectProps<CommonView & { label?: string }>,
) {
  wlog('++++++++++ PROPERTIES +++++++++++++');
  wlog(props.schema.properties);
  wlog(props.schema.patternProperties);
  wlog(props.schema.additionalProperties);
  wlog('---------- PROPERTIES -------------');
  if (props.schema.patternProperties || props.schema.additionalProperties) {
    debugger;
  }
  const [currentValue, setValue] = React.useState(props.value as CastedValues);
  useDeepChanges(props.value as CastedValues, nv =>
    props.schema.additionalProperties
      ? setValue(normalizeValues(nv))
      : props.value,
  );
  useDeepChanges(currentValue, props.onChange);

  React.useEffect(
    () => props.schema.additionalProperties && wlog(currentValue),
    [currentValue, props.schema.additionalProperties],
  );

  return (
    <CommonViewContainer errorMessage={props.errorMessage} view={props.view}>
      <fieldset
        className={cx(reset, {
          [borderTopStyle]: props.view.label !== undefined,
        })}
      >
        <legend className={legendStyle}>{props.view.label}</legend>
        {/* {props.children}
        {Object.entries(newValues).map(([k,v])=><Form key={JSON.stringify(values) + k} schema={} />)} */}
        {props.schema.additionalProperties ? (
          <>
            {currentValue &&
              Object.entries(currentValue).map(([k, v]) => (
                <EntryView
                  key={JSON.stringify(v) + k}
                  prop={k}
                  value={v}
                  onChange={(newKey, newVal) =>
                    setValue(ov => ({ ...omit(ov, k), [newKey]: newVal }))
                  }
                />
              ))}
            <IconButton
              icon="plus-circle"
              onClick={() => {
                wlog(props.value);
                wlog(currentValue);
                debugger;
              }}
              tooltip={'Add a new property'}
            />
          </>
        ) : (
          props.children
        )}
      </fieldset>
    </CommonViewContainer>
  );
}

export default HashMapView;
