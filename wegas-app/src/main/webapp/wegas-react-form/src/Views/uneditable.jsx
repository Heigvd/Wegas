import React from 'react';
import StringField from './string.jsx';

function UneditableView(props) {
    return (<StringField {...props}
                        disabled />);
}

export default UneditableView;
