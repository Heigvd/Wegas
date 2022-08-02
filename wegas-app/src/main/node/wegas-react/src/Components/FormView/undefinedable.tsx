import Form from 'jsoninput';
import { WidgetProps } from 'jsoninput/typings/types';
import * as React from 'react';
import { AvailableSchemas } from '.';
import { flex } from '../../css/classes';
import { Button } from '../Inputs/Buttons/Button';
import { CommonView, CommonViewContainer } from './commonView';
import { Labeled, LabeledView } from './labeled';

export interface UndefinedableViewProps
  extends WidgetProps.BaseProps<
    LabeledView &
      CommonView & {
        schema: AvailableSchemas;
        defaultValue?: unknown;
      }
  > {
  value?: Record<string, unknown> | undefined;
  onChange: (value: unknown | undefined) => void;
}

export default function UndefinedableView(
  props: UndefinedableViewProps,
): JSX.Element {
  const { errorMessage, view, onChange, value } = props;

  const { label, description, schema } = view;

  const [isUndef, setState] = React.useState(value == null);

  const switchToValue = React.useCallback(() => {
    onChange(view.defaultValue);
    setState(false);
  }, [onChange, view.defaultValue]);

  const switchToUndefined = React.useCallback(() => {
    onChange(undefined);
    setState(true);
  }, [onChange]);

  return (
    <CommonViewContainer errorMessage={errorMessage} view={view}>
      <Labeled label={label} description={description}>
        {({ labelNode }) => (
          <>
            <div className={flex}>
              {labelNode}
              <Button
                icon={isUndef ? 'edit' : 'ban'}
                onClick={isUndef ? switchToValue : switchToUndefined}
              />
            </div>
            {isUndef ? (
              <em>undefined</em>
            ) : (
              <Form schema={schema} value={value} onChange={onChange} />
            )}
          </>
        )}
      </Labeled>
    </CommonViewContainer>
  );
}
