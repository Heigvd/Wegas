import React, { PropTypes } from 'react';
import debounce from '../HOC/callbackDebounce';
import commonView from '../HOC/commonView';
import styles from '../css/string.css';


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
        this.setState({ value: event.target.value }, this.props.onChange(event.target.value));
    }
    render() {
        if (typeof this.props.view.rows === 'number') {
            return (
                <textarea
                    rows={this.props.view.rows}
                    onChange={ev => this.handleChange(ev)}
                    placeholder={this.props.view.placeholder}
                    style={{
                        fontSize: '14px',
                        color: 'darkgrey',

                    }}
                    value={this.state.value}
                    disabled={this.props.view.disabled}
                />
            );
        }
        return (<input
            className={styles.input}
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

export default commonView(debounceOnChange(StringView));
