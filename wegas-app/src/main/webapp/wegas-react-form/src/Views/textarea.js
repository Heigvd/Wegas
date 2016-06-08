import React from 'react';
import StringField from './string';

function TextareaView(props) {
    return (<StringField
        {...props}
        multiLine
    />);
}

export default TextareaView;
