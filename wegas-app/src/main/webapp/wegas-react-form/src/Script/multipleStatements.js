import React, { PropTypes } from 'react';
import { visit, types } from 'recast';
import addStatement from './addStatement';
const TYPE = {
    GETTER: 'getter',
    CONDITION: 'condition'
};
function collector(coll) {
    return path => {
        coll.push(path);
        return false;
    };
}
function multipleStatement(Comp) {
    function MultipleStatement(props) {
        const { code, onChange, type } = props;
        const rootExpression = [];
        if (type === TYPE.GETTER) {
            visit(code, {
                visitExpressionStatement: collector(rootExpression),
                visitEmptyStatement: collector(rootExpression)
            });
        } else if (type === TYPE.CONDITION) {
            visit(code, {
                visitBinaryExpression: collector(rootExpression),
                visitCallExpression: collector(rootExpression),
                visitEmptyStatement: collector(rootExpression)
            });
        }
        const children = rootExpression.map((path, i) => (
            <Comp
                {...props}
                key={i}
                node={path.value}
                onChange={(v) => {
                    const comments = path.get('comments');
                    path.replace(v);
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
    MultipleStatement.defaultProps = {
        type: TYPE.GETTER
    };
    MultipleStatement.propTypes = {
        code: PropTypes.array,
        onChange: PropTypes.func,
        type: PropTypes.oneOf([TYPE.CONDITION, TYPE.GETTER])
    };
    return MultipleStatement;
}

export default addStatement(multipleStatement);
