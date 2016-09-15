import React, { PropTypes } from 'react';
import classNames from 'classnames';
import styles from '../css/object.css';

function ObjectView(props) {
    return (
        <fieldset
            className={classNames(styles.root,
                { [styles.borderTop]: props.view.label },
                props.view.className)}
        >
            <legend className={styles.legend}>
                {props.view.label}
            </legend>
            {props.children}
            {props.errorMessage.map((message) => <div
                className={styles.error}
            >{message}</div>)}
        </fieldset>
    );
}

ObjectView.propTypes = {
    children: PropTypes.node,
    view: PropTypes.shape({
        className: PropTypes.string,
        label: PropTypes.string
    }),
    errorMessage: PropTypes.array,
    editKey: PropTypes.string
};
export default ObjectView;
