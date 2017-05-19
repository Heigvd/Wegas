import PropTypes from 'prop-types';
import React from 'react';
import { css } from 'glamor';
import FormStyles from '../Views/form-styles';

const labelStyle = css(
    FormStyles.labelStyle,
    {
        fontSize: '125%',
        marginBottom: '3px',
    }
);

export default function labeled(Comp, cssContainer = "" , suffixed = false) {
    function Labeled(props) {
        if (suffixed) {
            const id = props.path.join('-');
            return (
                <div className={cssContainer} >
                    < Comp { ...props } />
                    <label htmlFor={id} className={labelStyle} >
                        { props.view.label }
                    </label>
                </div>
            );
        } else {
            return (
                <div className={cssContainer} >
                    <div className={labelStyle} >
                        { props.view.label }
                    </div>
                    < Comp { ...props } />
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
