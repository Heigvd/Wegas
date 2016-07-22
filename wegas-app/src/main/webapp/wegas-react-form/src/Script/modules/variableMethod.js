import React, { PropTypes } from 'react';
import { types, print, parse } from 'recast';
import Container from 'jsoninput';
import { build, extractVar, schema as variableSchema, isVar } from './variable';
import { handleArgs } from './args';
import { methodSchema } from './method';
import isMatch from 'lodash/fp/isMatch';

const { builders: b, visit } = types;
window.r = print;
const buildMethod = v =>
    b.callExpression(
        b.memberExpression(
            build(v.variable),
            b.identifier(v.method)
        ),
        v.args
    );
const isVarMethod = node =>
    isMatch({ type: 'CallExpression', callee: { type: 'MemberExpression' } }, node) &&
    isVar(node.callee.object);
const extractMethod = (node) => {
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
    check() {
        if (this.state.variable && this.state.method) {
            this.props.onChange(buildMethod(this.state));
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
                    schema={methodSchema(view.method, this.state.variable)}
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
    view: PropTypes.object
};
export default VariableMethod;
