import PropTypes from 'prop-types';
import React from 'react';
import { css } from 'glamor';
import IconButton from '../../Components/IconButton';

const removeStatement = css({
    zoom: 0.8,
    ':hover': { backgroundColor: 'indianred' }
});
const addStatement = css({
    textAlign: 'center',
    ':hover': { backgroundColor: 'darkslategrey' }
});
const container = css({ display: 'inline-block', width: '22px' });

export function RemoveStatementButton(props) {
    return (
        <span className={container.toString()}>
            <IconButton
                icon="fa fa-minus"
                onClick={props.onClick}
                tooltip="remove"
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
            icon="fa fa-plus"
            tooltip="add"
            label={props.label}
            className={addStatement.toString()}
        />
    );
}
