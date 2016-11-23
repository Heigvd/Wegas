import React, { PropTypes } from 'react';
import classNames from 'classnames';
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

            />);
    }
    const { label = o.value, value, disabled } = o;
    return (
        <option
            key={i}
            value={value}
            disabled={disabled}
        >
            {label}
        </option>
    );
}

function SelectView(props) {
    const onChange = function onChange(event) {
        props.onChange(event.target.value);
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

