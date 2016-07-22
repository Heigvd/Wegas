import React, { PropTypes } from 'react';
import { visit, types } from 'recast';
import addStatement from './addStatement';

function multipleStatement(Comp) {
    function MultipleStatement(props) {
        const { code, onChange } = props;
        const rootExpression = [];
        visit(code, {
            visitExpressionStatement: path => {
                rootExpression.push(path);
                return false;
            },
            visitEmptyStatement: path => {
                rootExpression.push(path);
                return false;
            }
        });
        const children = rootExpression.map((path, i) => (
            <Comp
                {...props}
                key={i}
                node={path.value}
                onChange={(v) => {
                    const comments = path.get('comments');
                    path.replace(types.builders.expressionStatement(v));
                    path.get('comments').replace(comments.value);
                    onChange(code);
                }}
            />
        ));

        return (
            <div>
                {children}
            </div>
        );
    }

    MultipleStatement.propTypes = {
        code: PropTypes.array,
        onChange: PropTypes.func
    };
    return MultipleStatement;
}
export default addStatement(multipleStatement);
