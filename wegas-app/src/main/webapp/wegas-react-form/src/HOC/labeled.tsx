import React from 'react';
import { css } from 'glamor';
import FormStyles from '../Views/form-styles';

const labelStyle = css(FormStyles.labelStyle, {
    fontSize: '125%',
    marginBottom: '3px'
});

const prefixedLabelStyle = css(labelStyle, {
    display: 'block'
});

const labelTextStyle = css({
    // Leave some space between label (if any) and following widget:
    paddingRight: '8px'
});
interface Props {
    view: {
        label?: string
    }
}
export default function labeled(Comp: React.ComponentClass<any> | React.SFC<any>, cssContainer = '', suffixed = false) {
    function Labeled(props: Props) {
        if (suffixed) {
            return (
                <div className={cssContainer}>
                    <label>
                        <Comp {...props} />
                        <span {...labelStyle}>{props.view.label}</span>
                    </label>
                </div>
            );
        }
        return (
            <div className={cssContainer}>
                <label>
                    <span
                        {...prefixedLabelStyle}
                        className={props.view.label ? `${labelTextStyle}` : ''}
                    >
                        {props.view.label}
                    </span>
                    <Comp {...props} />
                </label>
            </div>
        );
    }
    return Labeled;
}
