import React from 'react';
import StringField from './string';

function TextareaView(props) {
    const view = { ...props.view, rows: 3 };
    return (<StringField
        {...props}
        view={view}
    />);
}

export default TextareaView;
