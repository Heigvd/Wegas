import * as React from 'react';
import { css, cx } from '@emotion/css';
import { WidgetProps } from 'jsoninput/typings/types';
import { CommonViewContainer, CommonView } from './commonView';

export const borderTopStyle = css({
  borderWidth: '1px 0 0 0',
});
export const reset = css({
  border: '0px solid #8e8e8e',
  padding: 0,
  margin: 0,
});
export const legendStyle = css({
  color: '#8e8e8e',
  textAlign: 'center',
});

function ObjectView(
  props: WidgetProps.ObjectProps<CommonView & { label?: string }>,
) {
  return (
    <CommonViewContainer errorMessage={props.errorMessage} view={props.view}>
      <fieldset
        className={cx(reset, {
          [borderTopStyle]: props.view.label !== undefined,
        })}
      >
        <legend className={legendStyle}>{props.view.label}</legend>
        {props.children}
      </fieldset>
    </CommonViewContainer>
  );
}

export default ObjectView;
