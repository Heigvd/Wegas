import React, { PropTypes } from 'react';
import debounce from '../HOC/callbackDebounce';
import commonView from '../HOC/commonView';
import styles from '../css/string.css';


const debounceOnChange = debounce('onChange');

function StringView(props) {
    if (typeof props.view.rows === 'number') {
        return (
            <textarea
                rows={props.view.rows}
                onChange={ev => props.onChange(ev.target.value)}
                placeholder={props.view.placeholder}
                style={{
                    fontSize: '14px',
                    color: 'darkgrey',

                }}
                defaultValue={props.value}
                disabled={props.view.disabled}
            />
        );
    }
    return (<input
        className={styles.input}
        type="text"
        placeholder={props.view.placeholder}
        defaultValue={props.value}
        onChange={ev => props.onChange(ev.target.value)}
        disabled={props.view.disabled}
    />
    );
}

StringView.propTypes = {
    onChange: PropTypes.func.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    view: PropTypes.shape({
        rows: PropTypes.number,
        disabled: PropTypes.bool,
        placeholder: PropTypes.string
    })
};
StringView.defaultProps = {
    value: '',
    view: {}
};

export default commonView(debounceOnChange(StringView));
