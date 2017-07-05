import PropTypes from 'prop-types';
import React from 'react';
import labeled from '../HOC/labeled';
import commonView from '../HOC/commonView';
import { css } from 'glamor';
import FormStyles from './form-styles';

const booleanContainerStyle = css({
    marginTop: '-5px',
    '& span': {
        display: 'inline-block',
        fontSize: FormStyles.labelFontSize,
        verticalAlign: '1px'
    },
    // Vertically align the following 'info' field on the label instead of the checkbox:
    '& + div': {
        marginLeft: '22px'
    }
});

const checkboxStyle = css({
    borderRadius: '3px',
    border: 'lightgrey solid 1px',
    marginTop: '5px',
    marginRight: '6px',
    width: '15px!important',
    maxWidth: '15px!important',
    fontSize: '14px'
});

function BooleanView(props) {
    const onChange = function onChange(event) {
        props.onChange(event.target.checked);
    };
    return (
        <input
            id={props.id}
            checked={props.value}
            type="checkbox"
            className={checkboxStyle}
            onChange={onChange}
        />
    );
}

BooleanView.defaultProps = {
    value: false
};

BooleanView.propTypes = {
    onChange: PropTypes.func.isRequired,
    view: PropTypes.shape({
        label: PropTypes.string
    }).isRequired,
    value: PropTypes.bool,
    path: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default commonView(
    labeled(BooleanView, `${booleanContainerStyle}`, true)
);
