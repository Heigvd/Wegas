import React, { PropTypes } from 'react';
import TextField from 'material-ui/TextField';
import debounce from '../HOC/callbackDebounce';

const debounceOnChange = debounce('onChange');

class StringView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            val: props.value
        };
        this.updateHandle = this.updateHandle.bind(this);
    }
    componentWillReceiveProps(next) {
        this.setState({ val: next.value });
    }
    updateHandle(event) {
        this.setState({ val: event.target.value }, () => this.props.onChange(this.state.val));
    }
    render() {
        const props = this.props;
        const errorMessage = props.errorMessage && props.errorMessage.length ?
            props.errorMessage :
            undefined;
        return (
            <TextField
                className={props.view.className}
                value={this.state.val || ''}
                floatingLabelText={props.view.label || props.path[props.path.length - 1]}
                errorText={errorMessage}
                onChange={this.updateHandle}
                disabled={props.disabled}
                multiLine={props.multiLine}
                fullWidth
            />
        );
    }
}

StringView.propTypes = {
    errorMessage: PropTypes.arrayOf(PropTypes.string),
    onChange: PropTypes.func.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    view: PropTypes.shape({
        label: PropTypes.string,
        className: PropTypes.string
    }),
    path: PropTypes.arrayOf(PropTypes.string),
    disabled: PropTypes.bool,
    multiLine: PropTypes.bool
};

export default debounceOnChange(StringView);
