import React, { PropTypes } from 'react';
import classNames from 'classnames';
import MenuItem from 'material-ui/MenuItem';
import async from '../HOC/async';
import commonView from '../HOC/commonView';
import styles from '../css/select.css';

function genItems(o, i) {
    if (typeof o !== 'object') {
        return (
            <option
                key={i}
                value={o}
                primaryText={o}
            >
            </option>);
    }
    const { label = o.value, value, disabled } = o;
    return (
        <option
            value={value}
            disabled={disabled}
        >
            {label}
        </option>
        );
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
        <select
            className={classNames(props.view.className, styles.select)}
            value={props.value}
            onChange={onChange}
        >
            {menuItems}
        </select>
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


export default commonView(async(SelectView)(({ view }) => {
    const { choices } = view;
    if (typeof choices === 'function') {
        return Promise.resolve(choices()).then(ch => ({ view: { ...view, choices: ch } }));
    }
    return {};
})
);

