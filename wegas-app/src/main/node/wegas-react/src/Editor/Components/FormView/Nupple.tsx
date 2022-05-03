import Form from 'jsoninput';
import { WidgetProps } from 'jsoninput/typings/types';
import * as React from 'react';
import { AvailableSchemas } from '.';
import { CommonView, CommonViewContainer } from './commonView';
import { Labeled, LabeledView } from './labeled';

interface NuppleView extends CommonView, LabeledView {
  itemsSchema: Record<string, AvailableSchemas>;
}

type NuppleProps = WidgetProps.ArrayProps<NuppleView>;

export default function Nupple({
  view,
  errorMessage,
  value,
  onChange,
}: NuppleProps) {
  const { itemsSchema } = view;

  const [parsedValue, setParsedValue] = React.useState(
    Object.keys(itemsSchema).reduce(
      (o, v, i) => ({ ...o, [v]: (value || [])[i] }),
      {},
    ),
  );

  const schema = React.useMemo(
    () => ({ descrition: 'nupple.internal', properties: itemsSchema }),
    [itemsSchema],
  );

  React.useEffect(() => {
    onChange(Object.values(parsedValue));
  }, [onChange, parsedValue]);

  return (
    <CommonViewContainer errorMessage={errorMessage} view={view}>
      <Labeled {...view}>
        {({ inputId, labelNode }) => (
          <>
            {labelNode}
            <div id={inputId}>
              <Form
                schema={schema}
                value={parsedValue}
                onChange={setParsedValue}
              />
            </div>
          </>
        )}
      </Labeled>
    </CommonViewContainer>
  );
}
