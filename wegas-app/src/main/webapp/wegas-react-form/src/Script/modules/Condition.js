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
            throw new Error(
                `Default value for 'returns' property '${type}' is not implemented`
            );
    }
}
/**
 * Find method's schema. Delegate to different method if it's a global method or a variable method.
 * @param {Object} node ast left node
 * @returns {Object} schema for given ast node
 */
function getMethodDescriptor(node) {
    const isCall = node.type === 'CallExpression';
    const { global, method, variable, member } = extractMethod(
        isCall ? node : node.left
    );
    return global
        ? globalMethodDescriptor(member, method)
        : methodDescriptor(variable, method);
}
function isBoolCallFn(node) {
    const isCall = node.type === 'CallExpression';
    const descr = getMethodDescriptor(node);
    return isCall && descr.returns === 'boolean';
}
class Condition extends React.Component {
    constructor(props) {
        super(props);
        const node = props.node;
        const descr = getMethodDescriptor(node);
        const isBoolCall = isBoolCallFn(node);
        if (isBoolCall) {
            this.state = { node: { left: node } };
        } else {
            this.state = {
                node: {
                    left: node.left,
                    right: node.right,
                    operator: node.operator || '===',
                },
            };
        }
        this.returns = descr && descr.returns; // store current method's returns

        this.sendUpdate = this.sendUpdate.bind(this);
    }
    componentWillReceiveProps(nextProps) {
        const node = nextProps.node;
        const descr = getMethodDescriptor(node);
        const isBoolCall = isBoolCallFn(node);
        if (isBoolCall) {
            this.setState({ node: { left: node } });
        } else {
            this.setState({
                node: {
                    left: node.left,
                    right: node.right,
                    operator: node.operator || '===',
                },
            });
        }
        this.returns = descr && descr.returns;
    }
    sendUpdate() {
        const node = this.state.node;
        const descr = getMethodDescriptor(node);
        if (descr.returns === 'boolean') {
            this.props.onChange(node.left);
        } else if (node.operator && node.left) {
            const n = b.binaryExpression(
                node.operator,
                node.left,
                node.right ||
                    valueToType(defaultValue(descr.returns), {
                        type: descr.returns,
                    })
            );
            this.props.onChange(n);
        }
    }
    check() {
        const node = this.state.node;
        const descr = getMethodDescriptor(node);
        if (!descr) {
            this.setState(({ node }) => ({
                node: { ...node, right: undefined },
            }));
        } else if (this.returns !== descr.returns) {
            this.setState(
                ({ node }) => ({
                    node: {
                        ...node,
                        operator: '===',
                        right: valueToType(defaultValue(descr.returns), {
                            type: descr.returns,
                        }),
                    },
                }),
                this.sendUpdate
            );
            this.returns = descr.returns;
        } else {
            this.sendUpdate();
        }
    }
    render() {
        const node = this.state.node;
        const isCall = node.type === 'CallExpression';
        const descr = getMethodDescriptor(node);
        const isBoolCall = isCall && descr.returns === 'boolean';
        let container;
        if (node.right) {
            const schema = {
                type: descr.returns,
                value: defaultValue(descr.returns),
                required: true,
            };
            container = [
                <div key="operator" className={containerStyle}>
                    <ConditionOperator
                        operator={node.operator}
                        onChange={v =>
                            this.setState(
                                ({ node }) => ({
                                    node: { ...node, operator: v },
                                }),
                                this.check
                            )
                        }
                        type={descr.returns}
                    />
                </div>,
                <div key="right" className={containerStyle}>
                    {renderForm(
                        node.right,
                        schema,
                        v =>
                            this.setState(
                                ({ node }) => ({ node: { ...node, right: v } }),
                                this.check
                            ),
                        undefined,
                        'right'
                    )}
                </div>,
            ];
        }
        return (
            <div>
                <Impact
                    {...this.props}
                    node={isBoolCall ? node : node.left}
                    onChange={v =>
                        this.setState(({ node }) => {
                            if (isBoolCall) {
                                return { node: v };
                            }
                            return { node: { ...node, left: v } };
                        }, this.check)
                    }
                />
                {container}
            </div>
        );
    }
}
Condition.propTypes = {
    onChange: PropTypes.func.isRequired,
    node: PropTypes.object.isRequired,
};
export default Condition;
