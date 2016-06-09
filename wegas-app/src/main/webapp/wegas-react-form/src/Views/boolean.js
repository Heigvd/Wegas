import React, { PropTypes } from 'react';
import Toggle from 'material-ui/Toggle';

function BooleanView(props) {
    const onChange = function onChange(event) {
        props.onChange(event.target.checked);
    };
    return (<Toggle
        className={props.view.className}
        defaultToggled={props.value}
        label={props.view.label || props.path[props.path.length - 1]}
        onToggle={onChange}
    />);
}

BooleanView.propTypes = {
    onChange: PropTypes.func.isRequired,
    view: PropTypes.shape({
        label: PropTypes.string,
        className: PropTypes.string
    }),
    value: PropTypes.bool,
    path: PropTypes.arrayOf(PropTypes.string)
};
export default BooleanView;
