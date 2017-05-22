import PropTypes from 'prop-types';
import React from 'react';
import debounce from '../HOC/callbackDebounce';
import labeled from '../HOC/labeled';
import commonView from '../HOC/commonView';
import { css } from 'glamor';
import FormStyles from './form-styles';

const inputStyle = css({
    borderRadius: '3px',
    boxSizing: 'border-box',
    border: '1px solid lightgrey',
    fontSize: '13px',
    color: 'darkslategrey',
    width: '100%',
    maxWidth: FormStyles.textInputWidth,
    padding: '0px'
});

const textareaFocus = css({
    ':focus': {
        border: '1px solid lightgrey'
    }
});

const textareaStyle = css(
    {
        borderRadius: '3px',
        width: '100%',
        maxWidth: FormStyles.textareaWidth,
        fontStyle: 'italic',
        fontSize: '15px',
        border: 'none',
        color: 'darkgrey'
    },
    textareaFocus
);


const debounceOnChange = debounce('onChange');
function fromNotToEmpty(value) {
    if (value === null || value === undefined) {
        return '';
    }
    return value;
}
class StringView extends React.Component {
    constructor(props) {
        super(props);
        this.state = { value: fromNotToEmpty(props.value) };
    }
    componentWillReceiveProps(nextProps) {
        this.setState({ value: fromNotToEmpty(nextProps.value) });
    }
    handleChange(event) {
        this.setState(
            { value: event.target.value },
            this.props.onChange(event.target.value)
        );
    }
    render() {
        if (typeof this.props.view.rows === 'number') {
            return (
                <textarea
                    className={textareaStyle}
                    rows={this.props.view.rows}
                    onChange={ev => this.handleChange(ev)}
                    placeholder={this.props.view.placeholder}
                    value={this.state.value}
                    disabled={this.props.view.disabled}
                />
            );
        }
        return (
            <input
                className={inputStyle}
                type="text"
                placeholder={this.props.view.placeholder}
                value={this.state.value}
                onChange={ev => this.handleChange(ev)}
                disabled={this.props.view.disabled}
            />
        );
    }
}

StringView.propTypes = {
    onChange: PropTypes.func.isRequired,
    // eslint-disable-next-line react/require-default-props
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    view: PropTypes.shape({
        rows: PropTypes.number,
        disabled: PropTypes.bool,
        placeholder: PropTypes.string
    }).isRequired
};

export default commonView(labeled(debounceOnChange(StringView)));
