import PropTypes from 'prop-types';
import React from 'react';
import StringField from './string';

function UneditableView(props) {
    return (
        <StringField
            {...props}
            view={{ ...props.view, readOnly: true }}
        />
    );
}
UneditableView.propTypes = {
    view: PropTypes.object
};
export default UneditableView;
