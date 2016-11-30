import React, { PropTypes } from 'react';
import { types } from 'recast';
import isMatch from 'lodash/fp/isMatch';
import Form from 'jsoninput';
import { build, extractVar, schema as variableSchema, isVariable } from './variable';
import { handleArgs } from './args';
import { methodSchema, genChoices } from './method';
import { genChoices as genGlobalChoices, handleArgs as handleGlobalArgs } from './globalMethod';

const {
    builders: b,
    visit
} = types;
const upgradeSchema = (varSchema, methodType = 'getter') => {
    const ret = {
        ...varSchema
    };
    ret.view = {
        ...ret.view,
        selectable: function selectable(item) {
            return genChoices(item, methodType).length;
        },
        additional: genGlobalChoices(methodType)
    };
    return ret;
};
const buildMethod = (v, type) => {
    if (type === 'getter') {
        return b.expressionStatement(
            buildMethod(v)
        );
    }
    return b.callExpression(
        b.memberExpression(
            build(v.variable),
            b.identifier(v.method)
        ),
        v.args
    );
};
const isGlobalMethod = node => isMatch({
    type: 'CallExpression',
    callee: {
        type: 'MemberExpression'
    }
}, node);
const isVarMethod = node => isMatch({
    type: 'CallExpression',
    callee: {
        type: 'MemberExpression'
    }
}, node) &&
    isVariable(node.callee.object);
export const extractMethod = (node) => {
    const ret = {
        global: false,
        variable: undefined,
        method: undefined,
        member: undefined,
        args: []
    };
    visit(node, {
        visitCallExpression: function visitCallExpression(path) {
            const nod = path.node;
            if (isVarMethod(nod)) {
                ret.method = nod.callee.property.value || nod.callee.property.name;
                ret.args = nod.arguments;
                ret.variable = extractVar(nod.callee.object);
                return false;
            } else if (isGlobalMethod(nod)) {
                ret.global = true;
                ret.method = nod.callee.property.value || nod.callee.property.name;
                ret.args = nod.arguments;
                ret.member = nod.callee.object.name;
                return false;
            }
            return this.traverse(path);
        }
    });
    return ret;
};
/**
 * handles method call on VariableDescriptor
 */
class VariableMethod extends React.Component {
    constructor(props) {
        super(props);
        const {
            global,
            method,
            member,
            variable,
            args
        } = extractMethod(props.node);
        this.state = {
            global,
            variable,
            method,
            member,
            args
        };
        this.handleVariableChange = this.handleVariableChange.bind(this);
    }
    componentWillReceiveProps(nextProps) {
        if (this.props.node !== nextProps.node) {
            this.setState(extractMethod(nextProps.node));
        }
    }
    check() {
        const schema = methodSchema(this.props.view.method, this.state.variable, this.props.type);
        if (!schema || !schema.view.choices.some(c => c.value === this.state.method)) {
            this.setState({
                method: undefined
            });
        } else if (this.state.variable && this.state.method) {
            try {
                this.props.onChange(buildMethod(this.state, this.props.type));
            } catch (e) {
                console.error(e);
            }
        }
    }
    handleVariableChange(v) {
        if (v.indexOf('.') > -1) { // global
            const split = v.split('.');
            this.setState({
                global: true,
                member: split[0],
                method: split[1],
                variable: undefined
            });
        } else {
            this.setState({
                global: false,
                variable: v,
                member: undefined
            }, this.check);
        }
    }
    render() {
        const {
            view
        } = this.props;
        let child = [(
            <Form
                key="variable"
                schema={upgradeSchema(variableSchema(view.variable), this.props.type)}
                value={this.state.global ? `${this.state.member}.${this.state.method}` : this.state.variable}
                onChange={this.handleVariableChange}
            />
            )];
        if (this.state.variable) {
            const schema = methodSchema(view.method, this.state.variable, this.props.type);
            if (schema) {
                child.push(
                    <Form
                        key="method"
                        schema={methodSchema(view.method, this.state.variable, this.props.type)}
                        value={this.state.method}
                        onChange={v => this.setState({
                            method: v
                        }, this.check)}
                    />
                );
            }
        }
        if (this.state.method && this.state.variable) {
            const {
                variable,
                method,
                args
            } = this.state;
            child = child.concat(
                handleArgs(variable, method, args, v => this.setState({
                    args: v
                }, this.check))
            );
        }
        if (this.state.member && this.state.method) {
            child = child.concat(
                handleGlobalArgs(`${this.state.member}.${this.state.method}`, this.state.args, (v) => {
                    this.setState({
                        args: v
                    });
                })
            );
        }
        return (
            <div>
                {child}
            </div>
        );
    }
}
VariableMethod.propTypes = {
    node: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    view: PropTypes.object,
    type: PropTypes.oneOf(['getter', 'condition'])
};
export default VariableMethod;
