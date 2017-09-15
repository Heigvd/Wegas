import PropTypes from 'prop-types';
import React from 'react';
import { types } from 'recast';
import Impact from './Impact';
import { methodDescriptor, extractMethod } from './method';
import { methodDescriptor as globalMethodDescriptor } from './globalMethod';
import ConditionOperator from './ConditionOperator';
import { renderForm, valueToType } from './args';
import { containerStyle } from '../Views/conditionImpactStyle';

const b = types.builders;
/**
 * return a default value for the given type
 * @param {string} type the type for which a default value is required
 * @returns {string|undefined|boolean} the default value
 */
function defaultValue(type) {
    switch (type) {
        case 'string':
            return '';
        case 'number':
            return undefined;
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
        const node = props.node,
              isCall = node.type === "CallExpression",
              descr = getMethodDescriptor(isCall ? node : node.left),
              isBoolCall = isCall && descr.returns === "boolean";
        if (isBoolCall) {
            this.state = node;
        } else {
            this.state = {
                left: node.left,
                right: node.right,
                operator: node.operator || '==='
            };
        }
        this.returns = descr && descr.returns; // store current method's returns
    }
    componentWillReceiveProps(nextProps) {
        const node = nextProps.node,
              isCall = node.type === "CallExpression",
              descr = isCall ? getMethodDescriptor(node) : null,
              isBoolCall = isCall && descr.returns === "boolean";
        if (isBoolCall && node.callee.property.name !== "getValue") {
            this.setState(node);
        } else {
            this.setState({
                left: node.left,
                right: node.right,
                operator: node.operator || '==='
            });
        }
    }
    check() {
        const state = this.state,
              isCall = state.type === "CallExpression",
              descr = getMethodDescriptor(isCall ? state : state.left),
              isBoolCall = isCall && descr.returns === "boolean";
        const sendUpdate = () => {
            if (isBoolCall && state.callee.property.name !== "getValue") {
                const node = b.callExpression(
                    state.callee,
                    state.arguments
                );
                this.props.onChange(node);
            } else {
                if (state.operator && state.left) {
                    const node = b.binaryExpression(
                        state.operator,
                        state.left,
                        state.right
                    );
                    this.props.onChange(node);
                }
            }
        };
        if (!descr) {
            this.setState({ right: undefined });
        } else if (this.returns !== descr.returns) {
            if (state.left.type === "CallExpression" &&
                descr.returns === "boolean" &&        // Is this the correct check for bool ???
                state.left.callee.property.name !== "getValue")
            {
                this.setState(state.left, sendUpdate);
            } else {
                this.setState({
                    operator: '===',
                    right: valueToType(defaultValue(descr.returns), {type: descr.returns})
                }, sendUpdate);
            }
            this.returns = descr.returns;
        } else {
            sendUpdate();
        }
    }
    render() {
        const state = this.state,
              isCall = state.type === "CallExpression",
              descr = getMethodDescriptor(isCall ? state : state.left),
              isBoolCall = isCall && descr.returns === "boolean";
        let container;
        if (descr && !isBoolCall) {
            const schema = {
                type: descr.returns,
                value: defaultValue(descr.returns),
                required: true
            };
            container = [(
                <div key="operator" className={containerStyle} >
                    <ConditionOperator
                        operator={state.operator}
                        onChange={v => this.setState({ operator: v }, this.check)}
                        type={descr.returns}
                    />
                </div>
            ),
            (<div key="right" className={containerStyle} >
                {renderForm(state.right, schema, v => this.setState({ right: v }, this.check), undefined, 'right')}
            </div>)];
        }
        return (
            <div>
                <Impact
                    {...this.props}
                    node={isBoolCall ? state : state.left}
                    onChange={v => this.setState((isBoolCall ? v : { left: v }), this.check)}
                />
                {container}
            </div>
        );
    }
}
Condition.propTypes = {
    onChange: PropTypes.func.isRequired,
    node: PropTypes.object.isRequired
};
export default Condition;
