import * as React from 'react';
import { WidgetProps } from 'jsoninput/typings/types';
import { css } from 'glamor';
import commonView from '../HOC/commonView';
import formStyles from './form-styles';

const inlineChildren = css({
    '& > * ': {
        display: 'inline-block',
    },
});
const labelStyle = css(formStyles.labelStyle, {
    display: 'block',
    borderBottom: '1px solid',
});
function Tuple(props: WidgetProps.ArrayProps & { id: string }) {
    return (
        <div id={props.id}>
            {props.view.label && (
                <label {...labelStyle}>{props.view.label}</label>
            )}
            <div {...inlineChildren}>{props.children}</div>
        </div>
    );
}
export default commonView(Tuple);
