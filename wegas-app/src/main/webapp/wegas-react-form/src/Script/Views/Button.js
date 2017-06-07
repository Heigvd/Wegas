import PropTypes from 'prop-types';
import React from 'react';
import { css } from 'glamor';
import IconButton from '../../Components/IconButton';

const removeStatement = css({
    ':hover': { color: 'indianred' }
});
const addStatement = css({
    textAlign: 'center',
    ':hover': { backgroundColor: 'lightgrey' }
});
const container = css({ display: 'inline-block' });

export function RemoveStatementButton(props) {
    return (
        <span className={container.toString()}>
            <IconButton
                icon="fa fa-minus-circle"
                onClick={props.onClick}
                tooltip="Remove"
                className={removeStatement.toString()}
            />
        </span>
    );
}

export function AddStatementButton(props) {
    return (
        <IconButton
            onClick={props.onClick}
            iconColor="#9DC06F"
            icon="fa fa-plus-circle"
            tooltip="Add"
            label={props.label}
            className={addStatement.toString()}
        />
    );
}

export function AddOptionButton(props) {
    return (
        <IconButton
            onClick={props.onClick}
            iconColor="#9DC06F"
            icon="fa fa-plus-circle"
            tooltip="Add option"
            label={props.label}
            className={props.className}
            prefixedLabel={true}
            labelClassName={props.labelClassName}
        />
    );
}
