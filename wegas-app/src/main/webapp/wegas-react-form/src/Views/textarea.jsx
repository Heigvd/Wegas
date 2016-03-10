import React from 'react';
import StringField from './string.jsx';

function TextareaView(props) {
    return (<StringField {...props}
                         multiLine />);
}

export default TextareaView;
