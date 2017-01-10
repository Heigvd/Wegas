import React, { PropTypes } from 'react';
import Form from 'jsoninput';
import { print, parse } from 'recast';
import { schema as variableSchema, varExist } from './Variable';
import { methodSchema, genChoices, extractMethod, buildMethod, handleArgs } from './method';
import { genChoices as genGlobalChoices, handleArgs as handleGlobalArgs, methodDescriptor } from './globalMethod';


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
    checkHandled() {
        if (this.props.node && this.props.node.type !== 'EmptyStatement') {
            if (!this.state.global && !this.state.variable) {
                return 'Not handled';
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
        const schema = methodSchema(this.props.view.method, this.state.variable, this.props.type);
        if (!schema || !schema.view.choices.some(c => c.value === this.state.method)) {
            this.setState({ // method does not exist in method's schema, remove it
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
    checkGlobalMethod() {
        if (this.state.member && this.state.method) {
            this.props.onChange(buildMethod(this.state, this.props.type));
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
            }, this.checkGlobalMethod);
        } else {
            this.setState({
                global: false,
                variable: v,
                member: undefined
            }, this.checkVariableMethod);
        }
    }
    render() {
        const {
            view,
            type,
            node
        } = this.props;
        const error = this.checkHandled();
        if (error) {
            return (<div>
                <input
                    defaultValue={print(node).code}
                    onChange={ev => this.setState(extractMethod(parse(ev.target.value)),
                        () => this.props.onChange(buildMethod(this.state, type)))
                    }
                />
                <div>{error}</div>
            </div>);
        }
        let child = [(
            <Form
                key="variable"
                schema={upgradeSchema(variableSchema(view.variable), type)}
                value={this.state.global ? `${this.state.member}.${this.state.method}` : this.state.variable}
                onChange={this.handleVariableChange}
            />
        )];
        if (this.state.variable) {
            const schema = methodSchema(view.method, this.state.variable, type);
            if (schema) {
                child.push(
                    <Form
                        key="method"
                        schema={methodSchema(view.method, this.state.variable, type)}
                        value={this.state.method}
                        onChange={v => this.setState({
                            method: v
                        }, this.checkVariableMethod)}
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
                }, this.checkVariableMethod))
            );
        }
        if (this.state.member && this.state.method) {
            child = child.concat(
                handleGlobalArgs(this.state.member, this.state.method, this.state.args, (v) => {
                    this.setState({
                        args: v
                    }, this.checkGlobalMethod);
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
