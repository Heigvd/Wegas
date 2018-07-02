import PropTypes from 'prop-types';
import React from 'react';
import { types } from 'recast';
import Impact, { ErrorCatcher } from './Impact';
import { methodDescriptor, extractMethod } from './method';
import { methodDescriptor as globalMethodDescriptor } from './globalMethod';
import ConditionOperator from './ConditionOperator';
import { renderForm, valueToAST, getReadOnlySchema } from './args';
import { containerStyle } from '../Views/conditionImpactStyle';

const b = types.builders;
const isCallExpression = types.namedTypes.CallExpression.check;
const isExpressionStatement = types.namedTypes.ExpressionStatement.check;
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
    const { global, method, variable, member } = extractMethod(
        isCallExpression(node) ? node : node.left
    );
    return global
        ? globalMethodDescriptor(member, method)
        : methodDescriptor(variable, method);
}
function isBoolCallFn(node) {
    const descr = getMethodDescriptor(node);
    return isCallExpression(node) && descr && descr.returns === 'boolean';
}
class Condition extends React.Component {
    constructor(props) {
        super(props);
        const { node } = props;
        const descr = getMethodDescriptor(node);
        if (isCallExpression(node)) {
            if (isBoolCallFn(node)) {
                this.state = { node: { left: node } };
            } else {
                this.state = { node: { left: node, operator: '===' } };
            }
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
        const { node } = nextProps;
        const descr = getMethodDescriptor(node);
        if (isCallExpression(node)) {
            if (isBoolCallFn(node)) {
                this.setState({ node: { left: node } });
            } else {
                this.setState({ node: { left: node, operator: '===' } });
            }
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
        const { node } = this.state;
        const descr = getMethodDescriptor(node);
        if (!descr && node.left) {
            this.props.onChange(node.left);
        } else if (
            descr &&
            descr.returns === 'boolean' &&
            (node.right === undefined ||
                (node.right &&
                    node.right.value === true &&
                    node.operator === '==='))
        ) {
            this.props.onChange(node.left);
        } else if (node.operator && node.left) {
            const n = b.binaryExpression(
                node.operator,
                node.left,
                node.right ||
                    valueToAST(defaultValue(descr.returns), {
                        type: descr.returns,
                    })
            );
            this.props.onChange(n);
        }
    }
    check() {
        const { node } = this.state;
        const descr = getMethodDescriptor(node);
        if (!descr) {
            this.setState(({ node: n }) => ({
                node: { ...n, right: undefined },
            }));
        } else if (this.returns !== descr.returns) {
            this.setState(
                ({ node: n }) => ({
                    node: {
                        ...n,
                        operator: '===',
                        right: valueToAST(defaultValue(descr.returns), {
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
        const { node } = this.state;
        const descr = getMethodDescriptor(node);
        let container;
        if (descr && typeof descr.returns !== 'string') {
            const { method } = extractMethod(
                isCallExpression(node) ? node : node.left
            );
            throw Error(
                `Method '${method}' is not comparable. Missing 'returns' description`
            );
        }
        if (node.right) {
            if (!descr) {
                const { method } = extractMethod(
                    isCallExpression(node) ? node : node.left
                );
                throw Error(`Method '${method}' not found`);
            }
            const schema = {
                type: descr.returns,
                value: defaultValue(descr.returns),
                required: true,
                view: {
                    layout: 'extraShortInline',
                },
            };
            let argsForm = renderForm(
                    node.right,
                    schema,
                    v =>
                        this.setState(
                            ({ node: n }) => ({ node: { ...n, right: v } }),
                            this.check
                        ),
                    undefined,
                    'right'
                );
            if (this.props.view.readOnly){
                argsForm = getReadOnlySchema(argsForm);
            }
            container = [
                <div key="operator" className={containerStyle}>
                    <ConditionOperator
                        operator={node.operator}
                        onChange={v =>
                            this.setState(
                                ({ node: n }) => ({
                                    node: { ...n, operator: v },
                                }),
                                this.check
                            )
                        }
                        type={descr.returns}
                        readOnly={this.props.view.readOnly}
                    />
                </div>,
                argsForm
            ];
        }
        const isBoolCall =
            isCallExpression(node) && descr.returns === 'boolean';
        return (
            <div>
                <Impact
                    {...this.props}
                    node={isBoolCall ? node : node.left}
                    onChange={v => {
                        if (isCallExpression(v)) {
                            this.setState(({ node: n }) => {
                                const des = getMethodDescriptor(v);
                                if (des && des.returns === 'boolean') {
                                    return { node: { left: v } };
                                }
                                return { node: { ...n, left: v } };
                            }, this.check);
                        } else if (isExpressionStatement(v)) {
                            this.props.onChange(v.expression);
                        } else {
                            this.props.onChange(v);
                        }
                    }}
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
export default function SecuredCondition(props) {
    return (
        <ErrorCatcher
            node={props.node}
            onChange={v => props.onChange(v.expression)}
        >
            <Condition {...props} />
        </ErrorCatcher>
    );
}
SecuredCondition.propTypes = {
    node: PropTypes.object,
    onChange: PropTypes.func.isRequired,
};
