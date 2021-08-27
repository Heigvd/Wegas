import PropTypes from 'prop-types';
import React from 'react';
import { types } from 'recast';
import isMatch from 'lodash-es/isMatch';
import SelectView from '../../Views/select';
import { getY } from '../../index';
import { isVariable, extractVar, build } from './Variable';
import { handleMethodArgs } from './args';

const { builders: b, visit, namedTypes: n } = types;
const Y = getY();
function methodDescriptor(variable, method) {
    if (!variable || !method) return null;
    try {
        return Y.Wegas.Facade.Variable.cache
            .find('name', variable)
            .getMethodCfgs()[method];
    } catch (e) {
        return undefined;
    }
}

/**
 * @param {string} variable variable to generate method from
 * @param {string} type 'condition' or 'getter' used to filter available methods
 * @returns {Array} list of available methods.
 */
function genChoices(variable, type) {
    const descr = Y.Wegas.Facade.Variable.cache.find('name', variable);
    if (descr === undefined) {
        return [];
    }
    const methods = descr.getMethodCfgs();
    return Object.keys(methods)
        .filter(
            k =>
                ('returns' in methods[k] && type === 'condition') ||
                (!('returns' in methods[k]) && type === 'getter')
        )
        .map(v => ({
            value: v,
            label: methods[v].label || v,
        }));
}
function handleArgs(variable, method, args, onChange) {
    const methodDescr = methodDescriptor(variable, method);
    if (!methodDescr) {
        throw Error(`Method '${method}' not found`);
    }
    return handleMethodArgs(methodDescr, args, onChange, variable);
}
// Replace with select with if it stays in this shape
function MethodView({ value, onChange, view }) {
    return <SelectView value={value} onChange={onChange} view={view} />;
}

MethodView.propTypes = {
    value: PropTypes.string,
    view: PropTypes.object,
    onChange: PropTypes.func,
};
const methodSchema = (view, variable, type) => {
    if (variable === undefined) {
        return null;
    }
    const choices = genChoices(variable, type);
    if (!choices.length) {
        return null;
    }
    // Don't show meaningless menus with only one entry (typically getValue() for variables in conditions):
    const hidden = choices.length === 1 && type === 'condition';
    return {
        type: 'string',
        required: true,
        value: choices[0].value,
        view: Object.assign({}, view, {
            type: hidden ? 'hidden' : MethodView,
            choices,
        }),
    };
};
const buildMethod = (v, type) => {
    if (type === 'getter') {
        return b.expressionStatement(buildMethod(v));
    }
    return b.callExpression(
        b.memberExpression(
            v.variable ? build(v.variable) : b.identifier(v.member),
            b.identifier(v.method)
        ),
        v.args
    );
};
const isGlobalMethod = node =>
    isMatch(node, {
        type: 'CallExpression',
        callee: {
            type: 'MemberExpression',
        },
    });
const isVarMethod = node =>
    (isMatch(node, { // e.g. Variable.find(gameModel, "myNumber").add(self, 12);
        type: 'CallExpression',
        callee: {
            type: 'MemberExpression',
        },
    }) && isVariable(node.callee.object))
    || isVariable(node); // e.g. Variable.find(gameModel, "myVariable");
/**
 * extract method informations
 * @param {AST} node any AST to visit.
 * @returns {{global:boolean, variable?:string, method?:string, member?:string, args:AST[]}}
 */
const extractMethod = node => {
    const ret = {
        global: false,
        variable: undefined,
        method: undefined,
        member: undefined,
        args: [],
    };
    visit(node, {
        visitCallExpression: function visitCallExpression(path) {
            const nod = path.node;
            if (isVariable(nod)) {
                ret.variable = extractVar(nod);
            } else if (isVarMethod(nod)) {
                ret.method =
                    nod.callee.property.value || nod.callee.property.name;
                ret.args = nod.arguments;
                ret.variable = extractVar(nod.callee.object);
                return false;
            } else if (isGlobalMethod(nod)) {
                ret.global = true;
                ret.method =
                    nod.callee.property.value || nod.callee.property.name;
                ret.args = nod.arguments;
                ret.member = nod.callee.object.name;
                return false;
            }

            let lastToken = nod.loc.tokens.pop();
            if (ret.variable !== undefined && ret.method === undefined) {
                while (lastToken && (lastToken.value === ';' || lastToken.value === ')')) {
                    lastToken = nod.loc.tokens.pop();
                }
                if (lastToken && lastToken.value.replace(/"/mg, '').replace(/'/mg, '') === ret.variable) {
                    ret.method = false;
                } else {
                    ret.method = null;
                }
            }

            return false;
        },
        visitNode: function visitNode(path) {
            if (n.ExpressionStatement.check(path.node)) {
                this.traverse(path);
            }
            return false;
        },
    });
    return ret;
};

export {
    methodSchema,
    methodDescriptor,
    genChoices,
    extractMethod,
    buildMethod,
    handleArgs,
};
