import React, { PropTypes } from 'react';
import { types } from 'recast';
import isMatch from 'lodash/fp/isMatch';
import Container from 'jsoninput';
import { build, extractVar, schema as variableSchema, isVar } from './variable';
import { handleArgs } from './args';
import { methodSchema } from './method';

const { builders: b, visit } = types;

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

const isVarMethod = node =>
    isMatch({ type: 'CallExpression', callee: { type: 'MemberExpression' } }, node) &&
    isVar(node.callee.object);
export const extractMethod = (node) => {
    const ret = {
        variable: undefined,
        method: undefined,
        args: []
    };
    visit(node, {
        visitCallExpression: function visitCallExpression(path) {
            const nod = path.node;
            if (isVarMethod(nod)) {
                ret.method = nod.callee.property.value || nod.callee.property.name;
                ret.args = nod.arguments;
            }
            ret.variable = extractVar(nod);
            this.traverse(path);
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
        const { method, variable, args } = extractMethod(props.node);
        this.state = {
            variable,
            method,
            args
        };
    }
    componentWillReceiveProps(nextProps) {
        if (this.props.node !== nextProps.node) {
            this.setState(extractMethod(nextProps.node));
        }
    }
    check() {
        const schema = methodSchema(this.props.view.method, this.state.variable, this.props.type);
        if (!schema.view.choices.some(c => c.value === this.state.method)) {
            this.setState({ method: undefined });
        } else if (this.state.variable && this.state.method) {
            try {
                this.props.onChange(buildMethod(this.state, this.props.type));
            } catch (e) {
                console.error(e);
            }
        }
    }
    render() {
        const { view } = this.props;
        let child = [(
            <Container
                key="variable"
                schema={variableSchema(view.variable)}
                value={this.state.variable}
                onChange={v => this.setState({ variable: v }, this.check)}
            />
        )];
        if (this.state.variable) {
            child.push(
                <Container
                    key="method"
                    schema={methodSchema(view.method, this.state.variable, this.props.type)}
                    value={this.state.method}
                    onChange={v => this.setState({ method: v }, this.check)}
                />
            );
        }
        if (this.state.method) {
            const { variable, method, args } = this.state;
            child = child.concat(
                handleArgs(variable, method, args, v => this.setState({ args: v }, this.check))
            );
        }
        return (
            <div>{child}</div>
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
