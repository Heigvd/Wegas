import PropTypes from 'prop-types';
import React from 'react';
import { visit, types } from 'recast';
import isMatch from 'lodash/isMatch';

const AND = '&&';
/**
 * Join multiple statements into AND condition 2 by 2
 * @param {Object[]} statements Array of statements
 */
function join(statements) {
    const ast = statements.filter(
        exp => !types.namedTypes.EmptyStatement.check(exp)
    );
    let st;
    switch (ast.length) {
        case 0:
            return [types.builders.emptyStatement()];
        case 1:
            return [types.builders.expressionStatement(ast[0])];
        default:
            st = types.builders.logicalExpression(
                AND,
                ast.shift(),
                ast.shift()
            );
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
                if (!isMatch(path.node.left, { type: 'LogicalExpression' })) {
                    expr.splice(0, 0, path.node.left);
                }
            },
            visitExpressionStatement(path) {
                if (
                    isMatch(path.node.expression, { type: 'LogicalExpression' })
                ) {
                    this.traverse(path);
                    return undefined;
                }
                expr.splice(0, 0, path.node.expression);
                return false;
            }
        });

        return (
            <Comp
                {...props}
                code={expr}
                onChange={ast => onChange(join(ast))}
                type="condition"
            />
        );
    }
    Condition.propTypes = {
        code: PropTypes.array.isRequired,
        onChange: PropTypes.func.isRequired
    };
    return Condition;
}
export default condition;
