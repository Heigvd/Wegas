import React, { PropTypes } from 'react';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import async from '../HOC/async';

function genItems(o, i) {
    if (typeof o !== 'object') {
        return (
            <MenuItem
                key={i}
                value={o}
                primaryText={o}
            />);
    }
    const { label = o.value, value, disabled } = o;
    return (
        <MenuItem
            key={i}
            value={value}
            primaryText={label}
            label={label}
            disabled={disabled}
        />);
}

function SelectView(props) {
    const errorMessage = props.errorMessage.length ?
        props.errorMessage :
        undefined;
    const onChange = function onChange(event, index, value) {
        setTimeout(props.onChange(value));
    };
    const choices = props.view.choices || [];
    const menuItems = choices.map(genItems);
    return (
        <SelectField
            className={props.view.className}
            value={props.value}
            floatingLabelText={props.view.label || props.editKey}
            errorText={errorMessage}
            onChange={onChange}
            disabled={props.disabled}
            fullWidth
        >
            {menuItems}
        </SelectField>
    );
}
SelectView.defaultProps = {
    errorMessage: []
};

SelectView.propTypes = {
    errorMessage: PropTypes.arrayOf(PropTypes.string).isRequired,
    onChange: PropTypes.func.isRequired,
    value: PropTypes.any,
    view: PropTypes.shape({
        label: PropTypes.string,
        className: PropTypes.string,
        choices: PropTypes.array,
        short: PropTypes.bool
    }),
    editKey: PropTypes.string,
    disabled: PropTypes.bool,
    multiLine: PropTypes.bool
};
export default async(SelectView)(({ view }) => {
    const { choices } = view;
    if (typeof choices === 'function') {
        return Promise.resolve(choices()).then(ch => ({ view: { ...view, choices: ch } }));
    }
    return {};
});
