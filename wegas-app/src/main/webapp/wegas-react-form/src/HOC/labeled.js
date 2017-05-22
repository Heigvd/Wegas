import PropTypes from 'prop-types';
import React from 'react';
import { css } from 'glamor';
import FormStyles from '../Views/form-styles';

const labelStyle = css(
    FormStyles.labelStyle,
    {
        fontSize: '125%',
        marginBottom: '3px'
    }
);

const prefixedLabelStyle = css(
    labelStyle,
    {
        display: 'block'
    }
);

const labelTextStyle = css({
    // Leave some space between label (if any) and following widget:
    paddingRight: '8px'
});

export default function labeled(Comp, cssContainer = "" , suffixed = false) {
    function Labeled(props) {
        if (suffixed) {
            return (
                <div className={cssContainer} >
                    <label className={labelStyle} >
                        < Comp { ...props } />
                        { props.view.label }
                    </label>
                </div>
            );
        } else {
            return (
                <div className={cssContainer} >
                    <label className={prefixedLabelStyle} >
                        <span className={ props.view.label ? `${labelTextStyle}` : '' } >
                            { props.view.label }
                        </span>
                        < Comp { ...props } />
                    </label>
                </div>
            );
        }
    }
    Labeled.propTypes = {
        view: PropTypes.shape({
            label: PropTypes.string
        })
    };
    return Labeled;
}
