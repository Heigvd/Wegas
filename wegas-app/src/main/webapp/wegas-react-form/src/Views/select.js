import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import labeled from '../HOC/labeled';
import async from '../HOC/async';
import commonView from '../HOC/commonView';
import { css } from 'glamor';

const selectStyle = css({
    padding: '2px',
    borderRadius: '3px',
    border: '1px solid lightgray'
});


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
            className={classNames(props.view.className, `${selectStyle}` )}
            value={props.value || ''}
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
        choices: PropTypes.array
    }),
    editKey: PropTypes.string,
    disabled: PropTypes.bool,
    multiLine: PropTypes.bool
};


export default commonView(async(labeled(SelectView))(({ view }) => {
    const { choices } = view;
    if (typeof choices === 'function') {
        return Promise.resolve(choices()).then(ch => ({ view: { ...view, choices: ch } }));
    }
    return {};
})
);

