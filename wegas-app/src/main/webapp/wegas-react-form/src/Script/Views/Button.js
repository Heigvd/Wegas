import React, { PropTypes } from 'react';
import IconButton from '../../Components/IconButton';
import styles from './Button.css';

export function RemoveStatementButton(props) {
    return (
        <span>
            <IconButton
                icon="fa fa-trash-o"
                onClick={props.onClick}
                tooltip="remove"
                className={styles.removeStatement}
            />
        </span>);
}

export function AddStatementButton(props) {
    return (<IconButton
        onClick={props.onClick}
        iconColor="#9DC06F"
        icon="fa fa-plus"
        tooltip="add"
        className={styles.addStatement}
    />);
}