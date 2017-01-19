import React, { PropTypes } from 'react';
import { types } from 'recast';
import isMatch from 'lodash/isMatch';
import SelectView from '../../Views/select';
import { getY } from '../../index';
import { isVariable, extractVar, build } from './Variable';
import { handleMethodArgs } from './args';

const {
    builders: b,
    visit
} = types;
const Y = getY();
function methodDescriptor(variable, method) {
    try {
        return Y.Wegas.Facade.Variable.cache.find('name', variable).getMethodCfgs()[method];
    } catch (e) {
        return null;
    }
}

/**
 * @param {string} variable variable to generate method from
 * @param {string} type 'condition' or 'getter' used to filter available methods
 * @returns {Array} list of available methods.
 */
function genChoices(variable, type) {
    const descr = Y.Wegas.Facade.Variable.cache.find('name', variable);
    const methods = descr.getMethodCfgs();
    return Object.keys(methods)
        .filter(k => ('returns' in methods[k] && type === 'condition') ||
            (!('returns' in methods[k]) && type === 'getter'))
        .map(v => ({
            value: v,
            label: methods[v].label || v
        }));
}
function handleArgs(variable, method, args, onChange) {
    const methodDescr = Y.Wegas.Facade.Variable.cache.find('name', variable)
        .getMethodCfgs()[method];
    return handleMethodArgs(methodDescr, args, onChange, variable);
}
// Replace with select with if it stays in this shape
function MethodView({
    value,
    onChange,
    view
}) {
    return (
        <SelectView
            value={value}
            onChange={onChange}
            view={view}
        />
    );
}

MethodView.propTypes = {
    value: PropTypes.string,
    view: PropTypes.object,
    onChange: PropTypes.func
};
const methodSchema = (view, variable, type) => {
    const choices = genChoices(variable, type);
    if (!choices.length) {
        return null;
    }
    return {
        type: 'string',
        required: true,
        value: choices[0].value,
        view: Object.assign({}, view, {
            type: MethodView,
            choices
        })
    };
};
const buildMethod = (v, type) => {
    if (type === 'getter') {
        return b.expressionStatement(
            buildMethod(v)
        );
    }
    return b.callExpression(
        b.memberExpression(
            v.variable ? build(v.variable) : b.identifier(v.member),
            b.identifier(v.method)
        ),
        v.args
    );
};
const isGlobalMethod = node => isMatch(node, {
    type: 'CallExpression',
    callee: {
        type: 'MemberExpression'
    }
});
const isVarMethod = node => isMatch(node, {
    type: 'CallExpression',
    callee: {
        type: 'MemberExpression'
    }
}) &&
    isVariable(node.callee.object);
const extractMethod = (node) => {
    const ret = {
        global: false,
        variable: undefined,
        method: undefined,
        member: undefined,
        args: []
    };
    visit(node, {
        visitCallExpression: function visitCallExpression(path) {
            const nod = path.node;
            if (isVarMethod(nod)) {
                ret.method = nod.callee.property.value || nod.callee.property.name;
                ret.args = nod.arguments;
                ret.variable = extractVar(nod.callee.object);
                return false;
            } else if (isGlobalMethod(nod)) {
                ret.global = true;
                ret.method = nod.callee.property.value || nod.callee.property.name;
                ret.args = nod.arguments;
                ret.member = nod.callee.object.name;
                return false;
            }
            return this.traverse(path);
        }
    });
    return ret;
};

export { methodSchema, methodDescriptor, genChoices, extractMethod, buildMethod, handleArgs };
