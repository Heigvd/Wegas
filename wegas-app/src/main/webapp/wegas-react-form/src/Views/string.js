import React, { PropTypes } from 'react';
import classNames from 'classnames';
import { grey500 } from 'material-ui/styles/colors';
import TextField from 'material-ui/TextField';
import debounce from '../HOC/callbackDebounce';
import commonView from '../HOC/commonView';
import styles from '../css/string.css';


const debounceOnChange = debounce('onChange');

function StringView(props) {
    if (typeof props.view.rows === 'number') {
        return (
            <textarea rows={props.view.rows} onChange={ev => props.onChange(ev.target.value)} />
        );
    }
    const length = props.view.length || '10';
    return (
        <input
            className={classNames({ [styles.numb]: length === 6 })}
            type="text"
            defaultValue={props.value}
            onChange={ev => props.onChange(ev.target.value)}
        />
    );
}

StringView.propTypes = {
    onChange: PropTypes.func.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    view: {
        rows: PropTypes.number
    }
};

export default commonView(debounceOnChange(StringView));
