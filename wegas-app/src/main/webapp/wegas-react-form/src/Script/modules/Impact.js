import PropTypes from 'prop-types';
import React from 'react';
import Form from 'jsoninput';
import { print, parse, types } from 'recast';
import { css } from 'glamor';
// import classNames from 'classnames';
import { schema as variableSchema, varExist } from './Variable';
// import ArgForm from './ArgForm';
import {
    methodSchema,
    genChoices,
    extractMethod,
    buildMethod,
    methodDescriptor,
    handleArgs,
} from './method';
import { valueToType } from './args';
import {
    genChoices as genGlobalChoices,
    methodDescriptor as globalMethodDescriptor,
    handleArgs as globalHandleArgs,
} from './globalMethod';
import JSEditor from '../Views/asyncJSEditor';
import { containerStyle } from '../Views/conditionImpactStyle';

const errorStyle = css({
    label: 'Impact-errorStyle',
    color: '#999',
    fontSize: '12px',
    paddingLeft: '40px',
    paddingTop: '3px',
    marginBottom: '-3px',
});

const upgradeSchema = (varSchema, methodType = 'getter') => {
    const ret = {
        ...varSchema,
    };
    ret.view = {
        ...ret.view,
        selectable: function selectable(item) {
            return genChoices(item, methodType).length;
        },
        additional: genGlobalChoices(methodType),
    };
    return ret;
};
function getState(node, method, type) {
    const { global, method: m, member, variable, args } = extractMethod(node);
    return {
        global,
        variable,
        method: m,
        member,
        args,
        methodSchem: methodSchema(method, variable, type),
    };
}
/**
 * handles method call on VariableDescriptor
 */
class Impact extends React.Component {
    constructor(props) {
        super(props);
        this.state = getState(props.node, props.view.method, props.type);
        this.handleVariableChange = this.handleVariableChange.bind(this);
    }
    componentWillReceiveProps(nextProps) {
        if (
            this.props.node !== nextProps.node ||
            this.props.view !== nextProps.view ||
            this.props.type !== nextProps.type
        ) {
            this.setState(
                getState(nextProps.node, nextProps.view.method, nextProps.type)
            );
        }
    }
    checkHandled() {
        if (this.props.node && this.props.node.type !== 'EmptyStatement') {
            if (!this.state.global && !this.state.variable) {
                throw Error('Unhandled');
            }
            if (this.state.global) {
                if (
                    !globalMethodDescriptor(
                        this.state.member,
                        this.state.method
                    )
                ) {
                    throw Error(
                        `Global function '${this.state.member}.${
                            this.state.method
                        }' not found`
                    );
                }
            }
            if (this.state.variable && !varExist(this.state.variable)) {
                throw Error(`Variable '${this.state.variable}' not found`);
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
                method: undefined,
            });
        } else if (this.state.variable && this.state.method) {
            try {
                const mergedArgs = methodDescriptor(
                    this.state.variable,
                    this.state.method
                ).arguments.map(
                    (v, i) => this.state.args[i] || valueToType(undefined, v)
                );
                this.setState(
                    () => ({
                        args: mergedArgs,
                    }),
                    () =>
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
            const mergedArgs = globalMethodDescriptor(
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
                    variable: undefined,
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
                    member: undefined,
                };
            }, this.checkVariableMethod);
        }
    }
    render() {
        const { view, type } = this.props;
        this.checkHandled();
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
            </div>,
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
                                        method: v,
                                    },
                                    this.checkVariableMethod
                                )
                            }
                        />
                    </div>
                );
            }
        }
        if (this.state.method && this.state.variable) {
            const { variable, method, args } = this.state;
            // const methodDesc = methodDescriptor(variable, method);
            // const argsDescr = (methodDesc && methodDesc.arguments) || [];
            child = child.concat(
                handleArgs(variable, method, args, v => {
                    this.setState(
                        () => ({ args: v }),
                        this.checkVariableMethod
                    );
                })
            );
        }
        if (this.state.member && this.state.method) {
            const { member, method, args } = this.state;

            child = child.concat(
                globalHandleArgs(member, method, args, v =>
                    this.setState(() => ({ args: v }), this.checkGlobalMethod)
                )
            );
        }
        return <span>{child}</span>;
    }
}
Impact.propTypes = {
    node: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    view: PropTypes.object,
    type: PropTypes.oneOf(['getter', 'condition']),
};
Impact.defaultProps = {
    node: undefined,
    view: {},
    type: 'getter',
};
// eslint-disable-next-line
export class ErrorCatcher extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: undefined, info: undefined };
        this.handleErrorBlur = this.handleErrorBlur.bind(this);
    }
    componentWillReceiveProps() {
        this.setState(() => ({ error: undefined, info: undefined }));
    }
    handleErrorBlur(target, editor) {
        const val = editor.getValue();
        try {
            const body =
                parse(val).program.body[0] || types.builders.emptyStatement();
            this.props.onChange(body);
        } catch (e) {
            // do nothing
        }
    }
    componentDidCatch(error, info) {
        this.setState(() => ({
            hasErrored: true,
            error,
            info,
        }));
    }
    render() {
        const { node, children } = this.props;

        if (this.state.error) {
            return (
                <div>
                    <JSEditor
                        value={print(node).code}
                        maxLines={5}
                        onBlur={this.handleErrorBlur}
                    />
                    <div className={errorStyle}>{this.state.error.message}</div>
                </div>
            );
        }
        return children;
    }
}
export default function SecuredImpact(props) {
    return (
        <ErrorCatcher node={props.node} onChange={props.onChange}>
            <Impact {...props} />
        </ErrorCatcher>
    );
}
