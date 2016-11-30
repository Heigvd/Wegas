import React, { PropTypes } from 'react';
import SelectView from '../../Views/select';
import { getY } from '../../index';

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

export { methodSchema, methodDescriptor, genChoices };
