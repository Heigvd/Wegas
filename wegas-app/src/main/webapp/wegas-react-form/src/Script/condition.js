import React, { PropTypes } from 'react';
import { visit, types } from 'recast';
import isMatch from 'lodash/fp/isMatch';

const AND = '&&';
function join(ast) {
    let st;
    switch (ast.length) {
    case 0:
        return ([types.builders.emptyStatement()]);
    case 1:
        return ([types.builders.expressionStatement(ast[0])]);
    default:
        st = types.builders.logicalExpression(AND, ast.shift(), ast.shift());
        while (ast.length) {
            st = types.builders.logicalExpression(AND, st, ast.shift());
        }
        return join([st]);
    }
}
/**
 * Split '&&' conditions into multiple statements
 * @param {React.Component} Comp component to decorate
 */
function condition(Comp) {
    /**
     * Condition Element
     * @param {Object} props Properties bag
     */
    function Condition(props) {
        const { code, onChange } = props;
        const expr = [];
        visit(code, {
            visitLogicalExpression(path) {
                expr.splice(0, 0, path.node.right);
                this.traverse(path);
                if (!isMatch({ type: 'LogicalExpression' }, path.node.left)) {
                    expr.splice(0, 0, path.node.left);
                }
            },
            visitExpressionStatement(path) {
                if (isMatch({ type: 'LogicalExpression' }, path.node.expression)) {
                    this.traverse(path);
                    return undefined;
                }
                expr.splice(0, 0, path.node.expression);
                return false;
            }
        });

        return (
            <Comp {...props} code={expr} onChange={ast => onChange(join(ast))} type="condition" />
        );
    }
    Condition.propTypes = {
        code: PropTypes.array.isRequired,
        onChange: PropTypes.func.isRequired
    };
    return Condition;
}
export default condition;
