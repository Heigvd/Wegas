import * as React from 'react';
import * as classNames from 'classnames';
import { css } from 'glamor';
import { WidgetProps } from 'jsoninput/typings/types';
import { CommonView } from './commonView';

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

function ObjectView(props: WidgetProps.ObjectProps) {
  return (
    <CommonView errorMessage={props.errorMessage} view={props.view}>
      <fieldset
        {...reset}
        className={classNames({
          [`${borderTopStyle}`]: props.view.label,
        })}
      >
        <legend {...legendStyle}>{props.view.label}</legend>
        {props.children}
      </fieldset>
    </CommonView>
  );
}

export default ObjectView;
