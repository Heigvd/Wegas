import PropTypes from 'prop-types';
import React from 'react';
import { types, visit } from 'recast';

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
        if (code.length > 1) {
            throw Error('Expecting 1 expression');
        }
        visit(code, {
            visitExpressionStatement(path) {
                this.traverse(path);
                return false;
            },
            visitLogicalExpression(path) {
                if (path.node.operator === AND) {
                    this.traverse(path);
                } else {
                    throw Error(`Unhandled operator '${path.node.operator}'`);
                }
                return false;
            },
            visitNode(path) {
                // the rest
                throw Error(`Unhandled '${path.node.type}'`);
            },
            visitCallExpression(path) {
                expr.push(path.node);
                return false;
            },
            visitBinaryExpression(path) {
                expr.push(path.node);
                return false;
            },
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
        onChange: PropTypes.func.isRequired,
    };
    return Condition;
}
export default condition;
