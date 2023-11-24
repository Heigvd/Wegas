import PropTypes from 'prop-types';
import React from 'react';
import { css } from '@emotion/css';
import labeled from '../HOC/labeled';
import commonView from '../HOC/commonView';
import FormStyles from './form-styles';

const booleanContainerStyle = css({
    label: 'boolean-booleanContainerStyle',
    marginTop: '-5px',
    '& span': {
        display: 'inline-block',
        fontSize: FormStyles.labelFontSize,
        verticalAlign: '1px',
    },
    // Vertically align the following 'info' field on the label instead of the checkbox:
    '& + div': {
        marginLeft: '22px',
    },
});

const checkboxStyle = css({
    borderRadius: '3px',
    border: 'lightgrey solid 1px',
    marginTop: '5px',
    marginRight: '6px',
    width: '15px!important',
    maxWidth: '15px!important',
    fontSize: '14px',
});

class BooleanView extends React.Component {
    constructor(props) {
        super(props);
        this.onChange = this.onChange.bind(this);
    }
    onChange(event) {
        this.props.onChange(event.target.checked);
    }
    render() {
        const { id, value } = this.props;
        return (
            <input
                id={id}
                checked={Boolean(value)}
                type="checkbox"
                disabled={this.props.view.readOnly}
                className={checkboxStyle}
                onChange={this.onChange}
            />
        );
    }
}

BooleanView.defaultProps = {
    value: false,
};

BooleanView.propTypes = {
    id: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    value: PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.number,
        PropTypes.string,
    ]),
};

export default commonView(
    labeled(BooleanView, `${booleanContainerStyle}`, true)
);
