import React, { PropTypes } from 'react';
import TextField from 'material-ui/TextField';

function StringView(props) {
    const errorMessage = props.errorMessage && props.errorMessage.length ?
        props.errorMessage :
        undefined;
    return (
        <TextField
            className={props.view.className}
            defaultValue={props.value}
            floatingLabelText={props.view.label || props.path[props.path.length - 1]}
            errorText={errorMessage}
            onChange={e => props.onChange(e.target.value)}
            disabled={props.disabled}
            multiLine={props.multiLine}
            fullWidth
        />
    );
}

StringView.propTypes = {
    errorMessage: PropTypes.arrayOf(PropTypes.string),
    onChange: PropTypes.func.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    view: PropTypes.shape({
        label: PropTypes.string,
        className: PropTypes.string
    }),
    path: PropTypes.arrayOf(PropTypes.string),
    disabled: PropTypes.bool,
    multiLine: PropTypes.bool
};

export default StringView;
