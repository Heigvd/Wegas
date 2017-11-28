import PropTypes from 'prop-types';
import React from 'react';
import { css } from 'glamor';
import IconButton from '../../Components/IconButton';
import classNames from 'classnames';

const removeStatement = css({
    color: '#d4d4d4',
    ':hover': { color: 'gray' },
});
const trashcan = css({
    color: 'white',
});
const container = css({ display: 'inline-block' });

export function RemoveStatementButton(props) {
    return (
        <IconButton
            {...props}
            icon={'fa fa-trash ' + trashcan.toString()}
            tooltip="Delete this item"
            className={classNames(
                removeStatement.toString(),
                container.toString()
            )}
            stackedOnIcon="fa fa-circle"
        />
    );
}

export function AddStatementButton(props) {
    return (
        <IconButton {...props} iconColor="#9DC06F" icon="fa fa-plus-circle" />
    );
}

export function AddOptionButton(props) {
    return (
        <IconButton
            {...props}
            iconColor="#9DC06F"
            icon="fa fa-plus-circle"
            prefixedLabel
        />
    );
}
