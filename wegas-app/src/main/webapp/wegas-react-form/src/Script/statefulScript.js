import PropTypes from 'prop-types';
import React from 'react';
import check from './validator';
/**
 * Transform a stateless Script Component into a stateful Component.
 */
export default function statefulScript(Comp) {
    class StatefulScript extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                value: props.value,
            };
            this.handleChange = this.handleChange.bind(this);
        }
        componentWillReceiveProps(nextProps) {
            this.setState({ value: nextProps.value });
        }
        validate() {
            return check(this.state.value.content);
        }
        handleChange(value) {
            this.setState({ value }, () => this.props.onChange(value));
        }
        render() {
            return (
                <Comp
                    {...this.props}
                    onChange={this.handleChange}
                    value={this.state.value}
                />
            );
        }
    }
    StatefulScript.propTypes = {
        value: PropTypes.any,
        onChange: PropTypes.func,
    };
    StatefulScript.defaultProps = {
        value: { '@class': 'Script', content: '' },
        onChange: function noop() {},
    };
    return StatefulScript;
}
