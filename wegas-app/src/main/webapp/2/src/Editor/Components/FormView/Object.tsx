import * as React from 'react';
import * as classNames from 'classnames';
import { css } from 'emotion';
import { WidgetProps } from 'jsoninput/typings/types';
import { CommonViewContainer, CommonView } from './commonView';

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

function ObjectView(
  props: WidgetProps.ObjectProps<CommonView & { label?: string }>,
) {
  return (
    <CommonViewContainer errorMessage={props.errorMessage} view={props.view}>
      <fieldset
        className={classNames(reset, {
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
