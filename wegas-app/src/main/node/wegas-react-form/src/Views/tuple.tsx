import * as React from 'react';
import { WidgetProps } from 'jsoninput/typings/types';
import { css } from '@emotion/css';
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
function Tuple(props: WidgetProps.ArrayProps<{ label?: string }> & { id: string }) {
    const {
        children,
        schema: { items },
        onChange,
        value,
    } = props;
    if (!Array.isArray(items)) {
        throw new Error('schema.items must be an array');
    }
    if (value && value.length === items.length) {
        return (
            <div id={props.id}>
                {props.view.label && <label {...labelStyle}>{props.view.label}</label>}
                <div {...inlineChildren}>{children}</div>
            </div>
        );
    }
    let newVal;
    if (value) {
        newVal = value.slice(0, items.length);
        newVal.length = items.length;
    } else {
        newVal = Array(items.length).fill(undefined);
    }
    onChange(newVal);
    return null;
}
export default commonView(Tuple);
