import * as React from 'react';
import { WidgetProps } from 'jsoninput/typings/types';
import { CommonViewContainer, CommonView } from './commonView';
import { Labeled, LabeledView } from './labeled';
import { SchemaPropsSchemas } from '../../../Components/PageComponents/tools/schemaProps';
import Form from 'jsoninput';

type SerializeViewBag = CommonView &
  LabeledView & {
    disabled?: boolean;
    tooltip?: string;
    schema: SchemaPropsSchemas;
  };

export type DictionaryViewProps = WidgetProps.ObjectProps<SerializeViewBag>;

export default function SerializeView({
  errorMessage,
  view,
  onChange,
  value,
}: DictionaryViewProps) {
  const { label, description, schema } = view;

  const onChangeCb = React.useCallback(
    (value: any) => {
      onChange(JSON.stringify(value));
    },
    [onChange],
  );

  let parsed: {};
  try {
    parsed = JSON.parse(typeof value === 'string' ? value : '{}');
  } catch {
    parsed = {};
  }

  return (
    <CommonViewContainer errorMessage={errorMessage} view={view}>
      <Labeled label={label} description={description}>
        {({ labelNode }) => (
          <>
            {labelNode}
            <Form schema={schema} value={parsed} onChange={onChangeCb} />
          </>
        )}
      </Labeled>
    </CommonViewContainer>
  );
}
