import React, { PropTypes } from 'react';
import styles from '../css/boolean.css';

function BooleanView(props) {
    const onChange = function onChange(event) {
        props.onChange(event.target.checked);
    };

    return (
        <div className={styles.short}>
            <label
                className={styles.label}
            >
                <input
                    type="checkbox"
                    onChange={ev => props.onChange(ev.target.checked)}
                />
                {props.view.label || props.path[props.path.length - 1]}
            </label>
        </div>
    );
}

BooleanView.propTypes = {
    onChange: PropTypes.func.isRequired,
    view: PropTypes.shape({
        label: PropTypes.string,
        className: PropTypes.string
    }),
    value: PropTypes.bool,
    path: PropTypes.arrayOf(PropTypes.string)
};
export default BooleanView;
