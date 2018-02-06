import PropTypes from 'prop-types';
import React from 'react';
import { visit } from 'recast';
import addStatement, { removeStatement } from './addStatement';

const TYPE = {
    GETTER: 'getter',
    CONDITION: 'condition',
};
function collector(coll) {
    return path => {
        coll.push(path);
        return false;
    };
}
/**
 * HOC split multiple statements.
 * @param {React.Component} Comp Component to augment.
 */
function multipleStatement(Comp) {
    const RemovableComp = removeStatement(Comp);
    /**
     * split code into expression chunk.
     * @param {{code:Object, onChange:(AST:Object)=>void, type:string}} props Component props
     */
    function MultipleStatement(props) {
        const { code, onChange, type, ...restProps } = props;
        const rootExpression = [];
        if (type === TYPE.GETTER) {
            visit(code, {
                visitNode: collector(rootExpression),
                // visitExpressionStatement: collector(rootExpression),
                // visitEmptyStatement: collector(rootExpression)
            });
        } else if (type === TYPE.CONDITION) {
            visit(code, {
                visitNode: collector(rootExpression),
                // visitCallExpression: collector(rootExpression),
                // visitEmptyStatement: collector(rootExpression),
            });
        }
        const children = rootExpression.map((path, i) => (
            <RemovableComp
                key={i}
                {...restProps}
                type={type}
                node={path.value}
                onChange={v => {
                    const comments = path.get('comments');
                    path.replace(v);
                    path.get('comments').replace(comments.value);
                    onChange(code);
                }}
                onRemove={() => {
                    code.splice(i, 1);
                    onChange(code);
                }}
            />
        ));

        return <div>{children}</div>;
    }
    MultipleStatement.defaultProps = {
        type: TYPE.GETTER,
    };
    MultipleStatement.propTypes = {
        code: PropTypes.array,
        onChange: PropTypes.func,
        type: PropTypes.oneOf([TYPE.CONDITION, TYPE.GETTER]),
    };
    return addStatement(MultipleStatement);
}

export default multipleStatement;
