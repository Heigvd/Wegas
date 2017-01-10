import React, { PropTypes } from 'react';
/**
 * Transform a stateless Script Component into a statefull Component.
 */
export default function statefullScript(Comp) {
    class StatefullScript extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                value: props.value
            };
            this.handleChange = this.handleChange.bind(this);
        }
        componentWillReceiveProps(nextProps) {
            this.setState({ value: nextProps.value });
        }
        validate() { // should find something to validate scripts.
            return true;
        }
        handleChange(value) {
            this.setState({ value }, () => this.props.onChange(value));
        }
        render() {
            return (<Comp {...this.props} onChange={this.handleChange} value={this.state.value} />);
        }
    }
    StatefullScript.propTypes = {
        value: PropTypes.any,
        onChange: PropTypes.func
    };
    StatefullScript.defaultProps = {
        value: { '@class': 'Script', content: '' },
        onChange: function noop() { }
    };
    return StatefullScript;
}
