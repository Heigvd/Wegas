import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import styles from '../css/boolean.css';

function BooleanView(props) {
    const onChange = function onChange(event) {
        props.onChange(event.target.checked);
    };
    const id = props.path.join('-');
    return (
        <div
            className={classNames(
                props.view.className,
                styles.container,
                {
                    [styles.indent]: props.view.indent
                })
            }
            style={{ marginTop: '7px' }}
        >
            <input
                id={id}
                checked={props.value}
                type="checkbox"
                className={styles.checkbox}
                onChange={onChange}
            />
            <label htmlFor={id} className={styles.label}>
                {props.view.label}
            </label>
        </div>
    );
}
BooleanView.defaultProps = {
    value: false
};
BooleanView.propTypes = {
    onChange: PropTypes.func.isRequired,
    view: PropTypes.shape({
        label: PropTypes.string,
        className: PropTypes.string,
        indent: PropTypes.bool
    }).isRequired,
    value: PropTypes.bool,
    path: PropTypes.arrayOf(PropTypes.string).isRequired
};
export default BooleanView;
