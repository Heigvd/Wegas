import { css } from '@emotion/css';
import { WidgetProps } from 'jsoninput/typings/types';
import * as React from 'react';
import { CheckBox } from '../Inputs/Boolean/CheckBox';
import { CommonView, CommonViewContainer } from './commonView';
import { Labeled, LabeledView } from './labeled';

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
