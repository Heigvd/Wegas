import * as React from 'react';
import { WidgetProps } from 'jsoninput/typings/types';
import { Labeled, LabeledView } from './labeled';
import { CommonViewContainer, CommonView } from './commonView';
import { CheckBox } from '../../../Components/Inputs/Boolean/CheckBox';
import { css } from 'emotion';

export interface BooleanProps
  extends WidgetProps.BaseProps<CommonView & LabeledView> {
  value?: boolean;
}

export default function BooleanView({
  view,
  errorMessage,
  value,
  onChange,
}: BooleanProps) {
  return (
    <CommonViewContainer errorMessage={errorMessage} view={view}>
      <Labeled {...view}>
        {({ inputId, labelNode }) => (
          <>
            {labelNode}
            <CheckBox
              id={inputId}
              value={value || false}
              readOnly={view.readOnly}
              onChange={onChange}
              className={css({ textAlign: 'inherit' })}
            />
          </>
        )}
      </Labeled>
    </CommonViewContainer>
  );
}
