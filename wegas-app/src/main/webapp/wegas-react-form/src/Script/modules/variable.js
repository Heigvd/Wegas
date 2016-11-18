import { types } from 'recast';
import React, { PropTypes } from 'react';
import Form from 'jsoninput';
import isMatch from 'lodash/fp/isMatch';

const { builders: b, visit } = types;
export const isVar = node => isMatch({
    type: 'CallExpression',
    callee: {
        type: 'MemberExpression',
        object: {
            type: 'Identifier',
            name: 'Variable'
        },
        property: {
            type: 'Identifier',
            name: 'find'
        }
    }
}, node);

export const extractVar = (node) => {
    let ret;
    visit(node, {
        visitCallExpression: function visitCallExpression(path) {
            const nod = path.node;
            if (isVar(nod)) {
                if (nod.arguments.length) {
                    ret = nod.arguments[nod.arguments.length - 1].value;
                }
            }
            return false;
        }
    });
    return ret;
};
export const build = v => (
        b.callExpression(
            b.memberExpression(
                b.identifier('Variable'),
                b.identifier('find')
            ),
            [
                b.identifier('gameModel'),
                b.literal(v)
            ]
        )
);
export const schema = optView => ({
    type: 'string',
    required: 'true',
    view: Object.assign({}, optView, {
        type: 'flatvariableselect'
    })
});
/**
 * Variable statement
 */
function Variable({ node, onChange, view }) {
    const value = extractVar(node);
    return (
        <Form
            schema={schema(view)}
            value={value}
            onChange={v => onChange(build(v))}
        />
    );
}
Variable.propTypes = {
    node: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    view: PropTypes.object
};
export default Variable;
