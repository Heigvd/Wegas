import PropTypes from 'prop-types';
import React from 'react';
import Form from 'jsoninput';
import { isEqualWith, cloneDeep } from 'lodash-es';
import { print, parse, types } from 'recast';
import { css } from 'glamor';
// import classNames from 'classnames';
import { schema as variableSchema, varExist, buildExpression } from './Variable';
// import ArgForm from './ArgForm';
import {
    methodSchema,
    genChoices,
    extractMethod,
    buildMethod,
    methodDescriptor,
    handleArgs,
} from './method';
import {
    updateArgSchema,
    matchSchema,
    valueToAST,
    getReadOnlySchema,
} from './args';
import {
    genChoices as genGlobalChoices,
    methodDescriptor as globalMethodDescriptor,
    handleArgs as globalHandleArgs,
} from './globalMethod';
import JSEditor from '../Views/asyncJSEditor';
import { containerStyle } from '../Views/conditionImpactStyle';

const errorStyle = css({
    color: '#999',
    fontSize: '12px',
    fontStyle: 'italic',
    paddingLeft: '40px',
    paddingTop: '3px',
    marginBottom: '-3px',
});

const upgradeSchema = (varSchema, impactView, methodType = 'getter') => {
    const ret = {
        ...varSchema,
    };
    ret.view = {
        ...ret.view,
        openIfEmpty: true,
        selectable: function selectable(item) {
            return genChoices(item, methodType).length;
        },
        readOnly: impactView.readOnly,
        additional: genGlobalChoices(methodType),
    };
    return ret;
};
function getState(node, method, type) {
    const { global, method: m, member, variable, args } = extractMethod(node);
    const state = {
        global,
        variable,
        method: m,
        member,
        args,
        methodSchem: methodSchema(method, variable, type),
    };

    // assert attrs
    if (state.method) {
        const argSchema = state.global
            ? globalMethodDescriptor(state.member, state.method)
            : methodDescriptor(state.variable, state.method);

        if (argSchema && argSchema.arguments.length === state.args.length) {
            argSchema.arguments.forEach((argDesc, i) => {
                if (argDesc.preProcessAST && args[i]) {
                    state.args[i] = argDesc.preProcessAST(
                        argDesc,
                        state.args[i],
                        {
                            valueToAST: valueToAST,
                        }
                    );
                }
            });
        }
    }

    return state;
}
/**
 * Update args inside state. return a new state.
 * @param state Impact's State
 */
function updateArgs(state) {
    if (state.method) {
        const argSchema = state.global
            ? globalMethodDescriptor(state.member, state.method)
            : methodDescriptor(state.variable, state.method);
        return {
            ...state,
            args: argSchema.arguments.map((v, i) =>
                updateArgSchema(state.args[i], v)
            ),
        };
    }
    return { ...state, args: [] };
}
/**
 * handles method call on VariableDescriptor
 */
class Impact extends React.Component {
    static getDerivedStateFromProps(nextProps, state) {
        if (state.prevProps === nextProps) {
            return null;
        }
        return {
            ...getState(nextProps.node, nextProps.view.method, nextProps.type),
            prevProps: nextProps,
        };
    }
    constructor(props) {
        super(props);
        this.state = {};
        this.handleVariableChange = this.handleVariableChange.bind(this);
    }
    /**
     * Check arguments after first parse. Initial value
     */
    componentDidMount() {
        const schema = this.state.global
            ? globalMethodDescriptor(this.state.member, this.state.method)
            : methodDescriptor(this.state.variable, this.state.method);
        if (schema) {
            const argsDescr = schema.arguments;
            if (this.state.args.length !== argsDescr.length) {
                // What to do with those additional args
                throw Error('Wrong number of arguments');
            }
            this.state.args.forEach((a, i) => {
                if (!matchSchema(a, argsDescr[i])) {
                    throw Error(
                        `Unexpected arg [${i}]. Value ( ${
                            print(a).code
                        } ) does not match type '${argsDescr[i].type}'`
                    );
                }
            });
        }
    }
    componentDidUpdate(prevProps, prevState) {
        if (!this.state.method && prevState.method) {
            this.props.onChange(buildExpression(this.state.variable));
        } else if (
            this.state.method &&
            (prevState.method !== this.state.method ||
                prevState.variable !== this.state.variable ||
                prevState.member !== this.state.member ||
                !isEqualWith(prevState.args, this.state.args, (val, oth, key) =>
                    (key === 'loc' ? true : undefined)
                ))
        ) {
            this.props.onChange(buildMethod(this.state, this.props.type));
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

    handleVariableChange(v) {
        if (v !== undefined && v.indexOf('.') > -1) {
            // global
            this.setState(prevState => {
                const split = v.split('.');
                return updateArgs({
                    ...prevState,
                    global: true,
                    member: split[0],
                    method: split[1],
                    variable: undefined,
                });
            });
        } else if (v !== undefined) {
            this.setState((prevState, props) => {
                const methodSchem = methodSchema(
                    props.view.method,
                    v,
                    props.type
                );
                return updateArgs({
                    ...prevState,
                    global: false,
                    variable: v,
                    methodSchem,
                    method:
                        // Reset method as it does not exist after a variable change
                        !methodSchem ||
                        !methodSchem.view.choices.some(
                            c => c.value === prevState.method
                        )
                            ? undefined
                            : prevState.method,
                    member: undefined,
                });
            });
        }
    }
    render() {
        const { view, type } = this.props;
        this.checkHandled();
        let child = [
            <div key="variable" className={containerStyle}>
                <Form
                    schema={upgradeSchema(
                        variableSchema(view.variable),
                        view,
                        type
                    )}
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
            let schema = this.state.methodSchem;
            if (schema) {
                if (view.readOnly) {
                    schema = cloneDeep(schema);
                    schema.view.readOnly = true;
                }
                child.push(
                    <div key="method" className={containerStyle}>
                        <Form
                            schema={schema}
                            value={this.state.method}
                            onChange={v =>
                                this.setState(prevState =>
                                    updateArgs({
                                        ...prevState,
                                        method: v,
                                    })
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
            let c = handleArgs(variable, method, args, v => {
                this.setState(() => ({ args: v }));
            });
            if (view.readOnly) {
                c = getReadOnlySchema(c);
            }
            child = child.concat(c);
        } if (this.state.member && this.state.method) {
            const { member, method, args } = this.state;
            let c = globalHandleArgs(member, method, args, v =>
                this.setState(() => ({ args: v }))
            );
            if (view.readOnly) {
                c = getReadOnlySchema(c);
            }
            child = child.concat(c);
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
        this.state = { error: undefined };
        this.handleErrorBlur = this.handleErrorBlur.bind(this);
    }
    componentDidUpdate(prevProps) {
        if (prevProps !== this.props && this.state.error !== undefined) {
            this.setState(() => ({
                error: undefined,
            }));
        }
    }
    componentDidCatch(error, info) {
        this.setState(() => ({
            hasErrored: true,
            error,
            info,
        }));
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
ErrorCatcher.propTypes = {
    node: PropTypes.object,
    children: PropTypes.element,
    onChange: PropTypes.func.isRequired,
};
export default function SecuredImpact(props) {
    return (
        <ErrorCatcher node={props.node} onChange={props.onChange}>
            <Impact {...props} />
        </ErrorCatcher>
    );
}
SecuredImpact.propTypes = {
    node: PropTypes.object,
    onChange: PropTypes.func.isRequired,
};
