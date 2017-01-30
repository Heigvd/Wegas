import React, { PropTypes } from 'react';
import { types } from 'recast';
import Impact from './Impact';
import { methodDescriptor, extractMethod } from './method';
import { methodDescriptor as globalMethodDescriptor } from './globalMethod';
import ConditionOperator from './ConditionOperator';
import { renderForm } from './args';

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
/**
 * Find method's schema. Delegate to different method if it's a global method or a variable method.
 * @param {Object} node ast left node
 * @returns {Object} schema for given ast node
 */
function getMethodDescriptor(node) {
    const { global, method, variable, member } = extractMethod(node);
    return global ? globalMethodDescriptor(member, method) : methodDescriptor(variable, method);
}
class Condition extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            left: props.node.left,
            right: props.node.right,
            operator: props.node.operator || '==='
        };
        const descr = getMethodDescriptor(this.state.left);
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
        const descr = getMethodDescriptor(this.state.left);
        if (!descr) {
            this.setState({ right: undefined });
        } else if (this.returns !== descr.returns) {
            this.setState({ operator: '===', right: undefined });
            this.returns = descr.returns;
        } else if (this.state.operator && this.state.left && this.state.right) {
            const node = b.binaryExpression(this.state.operator, this.state.left, this.state.right);
            this.props.onChange(node);
        }
    }
    render() {
        const descr = getMethodDescriptor(this.state.left);
        let container;
        if (descr) {
            const schema = {
                type: descr.returns,
                value: defaultValue(descr.returns)
            };
            container = [(
                <ConditionOperator
                    key="operator"
                    operator={this.state.operator}
                    onChange={v => this.setState({ operator: v }, this.check)}
                    type={descr.returns}
                />
            ), (renderForm(this.state.right, schema, v => this.setState({ right: v }, this.check), undefined, 'right')
            )];
        }
        return (
            <div>
                <Impact
                    {...this.props}
                    node={this.state.left}
                    onChange={v => this.setState({ left: v }, this.check)}
                />
                {container}
            </div>
        );
    }
}
Condition.propTypes = {
    onChange: PropTypes.func.isRequired,
    node: PropTypes.object
};
export default Condition;
