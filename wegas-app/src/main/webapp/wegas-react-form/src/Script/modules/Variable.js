import { types } from 'recast';
import PropTypes from 'prop-types';
import React from 'react';
import Form from 'jsoninput';
import isMatch from 'lodash/isMatch';
import { getY } from '../../index';

const {
    builders: b,
    visit
} = types;
export const isVariable = node => isMatch(node, {
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
});
export const varExist = name => Boolean(getY().Wegas.Facade.Variable.cache.find('name', name));
export const extractVar = (node) => {
    let ret;
    visit(node, {
        visitCallExpression: function visitCallExpression(path) {
            const nod = path.node;
            if (isVariable(nod)) {
                if (nod.arguments.length) {
                    // get last argument. Handle (self, var) and (var)
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
        type: 'treevariableselect'
    })
});
/**
 * Variable statement
 */
function Variable({
        node,
        onChange,
        view
    }) {
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
