import React from 'react';
import { visit, types } from 'recast';
import isMatch from 'lodash/fp/isMatch';
const AND = '&&';
function condition(Comp) {
    function Condition(props) {
        const { code, onChange } = props;
        const expr = [];
        visit(code, {
            visitLogicalExpression(path) {
                expr.splice(0, 0, path.value.right);
                this.traverse(path);
                if (!isMatch({ type: 'LogicalExpression' }, path.value.left)) {
                    expr.splice(0, 0, path.value.left);
                }
            },
            // visitExpressionStatement(path) {
            //     expr.splice(0, 0, path.value.expression);
            //     return false;
            // }
        });
        function join(ast) {
            let st;
            switch (ast.length) {
            case 0:
                onChange([types.builders.emptyStatement()]);
                break;
            case 1:
                onChange([types.builders.expressionStatement(ast[0])]);
                break;
            default:
                st = types.builders.logicalExpression(AND, ast.shift(), ast.shift());
                while (ast.length) {
                    st = types.builders.logicalExpression(AND, st, ast.shift());
                }
                join([st]);
            }
        }
        return (
            <Comp {...props} code={expr} onChange={join} type="condition" />
        );
    }

    return Condition;
}
export default condition;
