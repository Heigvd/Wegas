import PropTypes from 'prop-types';
import React from 'react';
import styles from './Statement.css';

export default function Statement(props) {
    return (
        <div className={styles.Statement}>
            {props.children}
        </div>
    );
}
