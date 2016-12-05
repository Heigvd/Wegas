import React, { PropTypes } from 'react';
import StringField from './string';

function UneditableView(props) {
    return (
        <StringField
            {...props}
            view={{ ...props.view, disabled: true }}
        />
    );
}
UneditableView.propTypes = {
    view: PropTypes.object
};
export default UneditableView;
