import PropTypes from 'prop-types';
import React from 'react';
import Form from 'jsoninput';
import { print, parse, types } from 'recast';
import { schema as variableSchema, varExist } from './Variable';
import ArgForm from './ArgForm';
import {
    methodSchema,
    genChoices,
    extractMethod,
    buildMethod,
    getMethodDescriptor
} from './method';
import { valueToType } from './args';
import {
    genChoices as genGlobalChoices,
    methodDescriptor
} from './globalMethod';
import JSEditor from '../Views/asyncJSEditor';
import { containerStyle } from '../Views/conditionImpactStyle';

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

/**
 * handles method call on VariableDescriptor
 */
class Impact extends React.Component {
    constructor(props) {
        super(props);
        const { global, method, member, variable, args } = extractMethod(
            props.node
        );
        this.state = {
            global,
            variable,
            method,
            member,
            args,
            methodSchem: methodSchema(props.view.method, variable, props.type)
        };
        this.handleVariableChange = this.handleVariableChange.bind(this);
    }
    componentWillReceiveProps(nextProps) {
        if (this.props.node !== nextProps.node) {
            this.setState(extractMethod(nextProps.node));
        }
    }
    checkHandled() {
        if (this.props.node && this.props.node.type !== 'EmptyStatement') {
            if (!this.state.global && !this.state.variable) {
                return 'Unhandled';
            }
            if (this.state.global) {
                if (!methodDescriptor(this.state.member, this.state.method)) {
                    return `No global ${this.state.member}.${this.state.method}`;
                }
            }
            if (this.state.variable && !varExist(this.state.variable)) {
                return `No variable ${this.state.variable}`;
            }
        }
        return '';
    }
    checkVariableMethod() {
        const schema = this.state.methodSchem;
        if (
            !schema ||
            !schema.view.choices.some(c => c.value === this.state.method)
        ) {
            this.setState({
                // method does not exist in method's schema, remove it
                method: undefined
            });
        } else if (this.state.variable && this.state.method) {
            try {
                const mergedArgs = getMethodDescriptor(
                    this.state.variable,
                    this.state.method
                ).arguments.map(
                    (v, i) => this.state.args[i] || valueToType(undefined, v)
                );
                this.setState(
                    {
                        args: mergedArgs
                    },
                    this.props.onChange(
                        buildMethod(this.state, this.props.type)
                    )
                );
            } catch (e) {
                console.error(e);
            }
        }
    }
    checkGlobalMethod() {
        if (this.state.member && this.state.method) {
            this.props.onChange(buildMethod(this.state, this.props.type));
        }
    }
    handleVariableChange(v) {
        if (v !== undefined && v.indexOf('.') > -1) {
            // global
            const split = v.split('.');
            const mergedArgs = methodDescriptor(
                split[0],
                split[1]
            ).arguments.map(
                (val, i) => this.state.args[i] || valueToType(undefined, val)
            );
            this.setState(
                () => ({
                    global: true,
                    member: split[0],
                    method: split[1],
                    args: mergedArgs,
                    variable: undefined
                }),
                this.checkGlobalMethod
            );
        } else if (v !== undefined) {
            this.setState((prevState, props) => {
                const methodSchem = methodSchema(
                    props.view.method,
                    v,
                    props.type
                );
                return {
                    global: false,
                    variable: v,
                    methodSchem,
                    member: undefined
                };
            }, this.checkVariableMethod);
        }
    }
    render() {
        const { view, type, node } = this.props;
        const error = this.checkHandled();
        if (error) {
            return (
                <div>
                    <JSEditor
                        value={print(node).code}
                        maxLines={5}
                        onChange={val => {
                            try {
                                const body =
                                    parse(val).program.body[0] ||
                                    types.builders.emptyStatement();
                                this.setState(extractMethod(body), () =>
                                    this.props.onChange(body)
                                );
                            } catch (e) {
                                // do nothing
                            }
                        }}
                    />
                    <div>{error}</div>
                </div>
            );
        }
        let child = [
            <div key="variable" className={containerStyle}>
                <Form
                    schema={upgradeSchema(variableSchema(view.variable), type)}
                    value={
                        this.state.global
                            ? `${this.state.member}.${this.state.method}`
                            : this.state.variable
                    }
                    onChange={this.handleVariableChange}
                />
            </div>
        ];
        if (this.state.variable) {
            const schema = this.state.methodSchem;
            if (schema) {
                child.push(
                    <div key="method" className={containerStyle}>
                        <Form
                            schema={schema}
                            value={this.state.method}
                            onChange={v =>
                                this.setState(
                                    {
                                        method: v
                                    },
                                    this.checkVariableMethod
                                )}
                        />
                    </div>
                );
            }
        }
        if (this.state.method && this.state.variable) {
            const { variable, method, args } = this.state;
            const methodDesc = getMethodDescriptor(variable, method);
            const argsDescr = (methodDesc && methodDesc.arguments) || [];
            child = child.concat(
                argsDescr.map((argDescr, i) => (
                    <ArgForm
                        key={i}
                        schema={argDescr}
                        value={args[i]}
                        onChange={v => {
                            this.setState(prevState => {
                                const prevArgs = prevState.args;
                                prevArgs[i] = v;
                                return { args: prevArgs };
                            }, this.checkVariableMethod);
                        }}
                    />
                ))
            );
        }
        if (this.state.member && this.state.method) {
            const { member, method, args } = this.state;
            const methodDesc = methodDescriptor(member, method);
            const argsDescr = (methodDesc && methodDesc.arguments) || [];
            child = child.concat(
                argsDescr.map((argDescr, i) => (
                    <ArgForm
                        key={i}
                        schema={argDescr}
                        value={args[i]}
                        onChange={v => {
                            this.setState(prevState => {
                                const newArgs = prevState.args.map((a, j) => {
                                    if (i === j) {
                                        return v;
                                    }
                                    return a;
                                });
                                return { args: newArgs };
                            }, this.checkGlobalMethod);
                        }}
                    />
                ))
            );
        }
        return (
            <span className={containerStyle}>
                {child}
            </span>
        );
    }
}
Impact.propTypes = {
    node: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    view: PropTypes.object,
    type: PropTypes.oneOf(['getter', 'condition'])
};
Impact.defaultProps = {
    node: undefined,
    view: {},
    type: 'getter'
};
export default Impact;
