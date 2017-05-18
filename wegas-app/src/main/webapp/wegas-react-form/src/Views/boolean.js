import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import labeled from '../HOC/labeled';
import commonView from '../HOC/commonView';
import styles from '../css/boolean.css';

function BooleanView(props) {
    const onChange = function onChange(event) {
        props.onChange(event.target.checked);
    };
    const id = props.path.join('-');
    return (
            <input
                id={id}
                checked={props.value}
                type="checkbox"
                className={styles.checkbox}
                onChange={onChange}
            />
    );
}

BooleanView.defaultProps = {
    value: false,
    view: {
        className: styles.label,
        marginTop: '7px'
    }
};

BooleanView.propTypes = {
    onChange: PropTypes.func.isRequired,
    view: PropTypes.shape({
        label: PropTypes.string,
        className: PropTypes.string,
        boolean: PropTypes.bool,
    }).isRequired,
    value: PropTypes.bool,
    path: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default commonView(labeled(BooleanView, styles.boolean, true));
