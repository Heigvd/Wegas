import * as React from 'react';
import { WidgetProps } from 'jsoninput/typings/types';
import { CommonViewContainer, CommonView } from './commonView';
import { Labeled, LabeledView } from './labeled';
import Form from 'jsoninput';
import { AvailableSchemas } from '.';

type SerializeViewBag = CommonView &
  LabeledView & {
    disabled?: boolean;
    tooltip?: string;
    schema: AvailableSchemas;
  };

export type SerializerViewProps = WidgetProps.ObjectProps<SerializeViewBag>;

export default function SerializeView({
  errorMessage,
  view,
  onChange,
  value,
}: SerializerViewProps) {
  const { label, description, schema } = view;

  const onChangeCb = React.useCallback(
    (value: unknown) => {
      onChange(JSON.stringify(value));
    },
    [onChange],
  );

  let parsed: undefined;
  try {
    parsed = JSON.parse(typeof value === 'string' ? value : '{}');
  } catch {
    parsed = undefined;
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
