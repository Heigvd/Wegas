import React, { PropTypes } from 'react';
import { types } from 'recast';
import Form from 'jsoninput';
import VariableMethod, { extractMethod } from './VariableMethod';
import { methodDescriptor } from './method';
import ConditionOperator from './ConditionOperator';
import { typeToValue, valueToType } from './args';

const b = types.builders;
/**
 * return a default value for the given type
 * @param {string} type the type for which a default value is required
 * @returns {string|number|boolean} the default value
 */
function defaultValue(type) {
    switch (type) {
    case 'string':
        return '';
    case 'number':
        return 0;
    case 'boolean':
        return true;
    default:
        throw new Error(`Default value for 'returns' property '${type}' is not implemented`);
    }
}
class VariableCondition extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            left: props.node.left,
            right: props.node.right,
            operator: props.node.operator || '==='
        };
        const { method, variable } = extractMethod(this.state.left);
        const descr = methodDescriptor(variable, method);
        this.returns = descr && descr.returns; // store current method's returns
    }
    componentWillReceiveProps(nextProps) {
        this.setState({
            left: nextProps.node.left,
            right: nextProps.node.right,
            operator: nextProps.node.operator || '==='
        });
    }
    check() {
        const { method, variable } = extractMethod(this.state.left);
        const descr = methodDescriptor(variable, method);
        if (!descr) {
            this.setState({ right: undefined });
        } else if (this.returns !== descr.returns) {
            this.setState({ operator: '===', right: undefined });
            this.returns = descr.returns;
            return;
        } else if (this.state.operator && this.state.left && this.state.right) {
            const node = b.binaryExpression(this.state.operator, this.state.left, this.state.right);
            this.props.onChange(node);
        }
    }
    render() {
        const { method, variable } = extractMethod(this.state.left);
        const descr = methodDescriptor(variable, method);
        let container;
        if (descr) {
            const schema = {
                type: descr.returns,
                value: defaultValue(descr.returns),
                view: { label: 'value' }
            };
            container = [(
                <ConditionOperator
                    key="operator"
                    operator={this.state.operator}
                    onChange={v => this.setState({ operator: v }, this.check)}
                    type={descr.returns}
                />
            ), (
                <Form
                    key="right"
                    schema={schema}
                    value={typeToValue(this.state.right, schema)}
                    onChange={v => this.setState({ right: valueToType(v, schema) }, this.check)}
                />
            )];
        }
        return (
            <div>
                <VariableMethod
                    {...this.props}
                    node={this.state.left}
                    onChange={v => this.setState({ left: v }, this.check)}
                />
                {container}
            </div>
        );
    }
}
VariableCondition.propTypes = {
    onChange: PropTypes.func.isRequired,
    node: PropTypes.object
};
export default VariableCondition;
