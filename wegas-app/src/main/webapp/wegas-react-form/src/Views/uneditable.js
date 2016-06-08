import React from 'react';
import StringField from './string';

function UneditableView(props) {
    return (
        <StringField
            {...props}
            disabled
        />
    );
}

export default UneditableView;
